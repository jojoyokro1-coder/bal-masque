const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'bal_masque_secret_2026';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Inscription client
const register = async (req, res) => {
  let { nom, prenom, email, password } = req.body;

  if (!nom || !prenom || !email || !password) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  nom = String(nom).trim();
  prenom = String(prenom).trim();
  email = String(email).trim().toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'Format d\'adresse email invalide.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Cet email est deja utilise.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [created] = await db.query(
      "INSERT INTO users (nom, prenom, email, password, role) VALUES (?, ?, ?, ?, 'client') RETURNING id",
      [nom, prenom, email, hashed]
    );

    const user = { id: created[0].id, nom, prenom, email, role: 'client' };
    const token = jwt.sign(
      user,
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ message: 'Compte cree avec succes.', token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Connexion
const login = async (req, res) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis.' });
  }

  email = String(email).trim().toLowerCase();

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ message: 'Format d\'adresse email invalide.' });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Identifiants incorrects.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { register, login };

