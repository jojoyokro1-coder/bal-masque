require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(passport.initialize());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/tickets', require('./routes/tickets'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.0' }));

module.exports = app;
