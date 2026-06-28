const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../config/db');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// Rate limiter strict pour la connexion et l'inscription (max 10 tentatives par 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Trop de tentatives de connexion ou de création de compte. Veuillez réanalyser ou attendre 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});


const JWT_SECRET = process.env.JWT_SECRET || 'bal_masque_secret_2026';
const isProduction = process.env.NODE_ENV === 'production';
const FRONTEND_URL = (process.env.FRONTEND_URL || (isProduction ? 'https://bal-masque.vercel.app' : 'http://localhost:3000')).replace(/\/$/, '');
const OAUTH_BASE_URL = (process.env.OAUTH_BASE_URL || process.env.BACKEND_URL || FRONTEND_URL).replace(/\/$/, '');

const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const facebookConfigured = Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);

const redirectWithError = (res, message = 'oauth_failed') => {
  res.redirect(`${FRONTEND_URL}/login?oauth_error=${encodeURIComponent(message)}`);
};

const buildUserPayload = (user) => ({
  id: user.id,
  nom: user.nom,
  prenom: user.prenom,
  email: user.email,
  role: user.role
});

const splitDisplayName = (displayName = '') => {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { prenom: parts[0] || '', nom: '' };
  return { prenom: parts.slice(0, -1).join(' '), nom: parts[parts.length - 1] };
};

const findOrCreateOAuthUser = async (profile) => {
  const email = profile.emails?.[0]?.value || `${profile.provider}_${profile.id}@oauth.local`;
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

  if (rows.length > 0) return buildUserPayload(rows[0]);

  const { nom, prenom } = splitDisplayName(profile.displayName);
  const [created] = await db.query(
    "INSERT INTO users (nom, prenom, email, password, role) VALUES (?, ?, ?, '', 'client') RETURNING id",
    [nom || profile.provider, prenom || '', email]
  );

  return {
    id: created[0].id,
    nom: nom || profile.provider,
    prenom: prenom || '',
    email,
    role: 'client'
  };
};

const completeOAuthLogin = async (req, res) => {
  try {
    const user = await findOrCreateOAuthUser(req.user);
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
    const encodedUser = encodeURIComponent(JSON.stringify(user));
    res.redirect(`${FRONTEND_URL}/login?token=${encodeURIComponent(token)}&user=${encodedUser}`);
  } catch (err) {
    console.error(err);
    redirectWithError(res);
  }
};

const requireOAuthConfig = (provider, configured) => (req, res, next) => {
  if (!configured) {
    return res.status(503).json({
      message: `Connexion ${provider} non configuree. Ajoutez les variables OAuth sur Vercel.`
    });
  }
  next();
};

if (googleConfigured) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${OAUTH_BASE_URL}/api/auth/google/callback`
  }, (accessToken, refreshToken, profile, done) => done(null, profile)));
}

if (facebookConfigured) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: `${OAUTH_BASE_URL}/api/auth/facebook/callback`,
    profileFields: ['id', 'displayName', 'emails']
  }, (accessToken, refreshToken, profile, done) => done(null, profile)));
}

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

router.get('/google',
  requireOAuthConfig('Google', googleConfigured),
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get('/google/callback',
  requireOAuthConfig('Google', googleConfigured),
  passport.authenticate('google', {
    failureRedirect: `${FRONTEND_URL}/login?oauth_error=google_failed`,
    session: false
  }),
  completeOAuthLogin
);

router.get('/facebook',
  requireOAuthConfig('Facebook', facebookConfigured),
  passport.authenticate('facebook', { scope: ['email'], session: false })
);

router.get('/facebook/callback',
  requireOAuthConfig('Facebook', facebookConfigured),
  passport.authenticate('facebook', {
    failureRedirect: `${FRONTEND_URL}/login?oauth_error=facebook_failed`,
    session: false
  }),
  completeOAuthLogin
);

module.exports = router;
