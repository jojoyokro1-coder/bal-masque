require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const antiScrapingMiddleware = require('./middleware/antiScraping');

const app = express();

// Activer le trust proxy si derrière un reverse-proxy (Vercel, Nginx, Cloudflare)
app.set('trust proxy', 1);

// En-têtes de sécurité HTTP
app.use(helmet());
app.use('/api/', antiScrapingMiddleware);

// Rate Limiter général pour l'API (max 150 requêtes par 15 minutes par IP)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: { message: 'Trop de requêtes depuis cette adresse IP, veuillez réessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', generalLimiter);

const publicScrapeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: 'Trop de requetes, veuillez reessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/tickets/evenement', publicScrapeLimiter);
app.use('/api/auth/client-auth-status', publicScrapeLimiter);

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(passport.initialize());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/votes', require('./routes/votes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

module.exports = app;
