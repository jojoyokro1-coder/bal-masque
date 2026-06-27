const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { ensureTicketCategoryColumns } = require('../utils/ticketCategories');

// Créer un inspecteur
const creerInspecteur = async (req, res) => {
  const { nom, prenom, email, password } = req.body;

  if (!nom || !prenom || !email || !password) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [created] = await db.query(
      "INSERT INTO users (nom, prenom, email, password, role, created_by) VALUES (?, ?, ?, ?, 'inspecteur', ?) RETURNING id",
      [nom, prenom, email, hashed, req.user.id]
    );

    res.status(201).json({ message: 'Inspecteur créé avec succès.', id: created[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Liste des inspecteurs
const listeInspecteurs = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nom, prenom, email, created_at FROM users WHERE role = 'inspecteur' ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Supprimer un inspecteur
const supprimerInspecteur = async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id = ? AND role = 'inspecteur'", [req.params.id]);
    res.json({ message: 'Inspecteur supprimé.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Statistiques globales
const statistiques = async (req, res) => {
  try {
    const [[{ totalTickets }]] = await db.query('SELECT COUNT(*)::int as "totalTickets" FROM tickets');
    const [[{ ticketsScanned }]] = await db.query("SELECT COUNT(*)::int as \"ticketsScanned\" FROM tickets WHERE statut = 'utilise'");
    const [[{ totalVentes }]] = await db.query("SELECT COALESCE(SUM(montant_total),0)::numeric as \"totalVentes\" FROM commandes WHERE statut = 'payee'");
    const [[{ totalClients }]] = await db.query("SELECT COUNT(*)::int as \"totalClients\" FROM users WHERE role = 'client'");
    const [evenement] = await db.query('SELECT * FROM evenements WHERE actif = true LIMIT 1');

    res.json({
      totalTickets,
      ticketsScanned,
      ticketsActifs: totalTickets - ticketsScanned,
      totalVentes,
      totalClients,
      evenement: evenement[0] || null
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Remettre les compteurs du tableau de bord a zero
const reinitialiserCompteurs = async (req, res) => {
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM tickets');
    await client.query('DELETE FROM commandes');
    await client.query("DELETE FROM users WHERE role = 'client'");
    await client.query('UPDATE evenements SET quantite_disponible = quantite_totale WHERE actif = true');
    await client.query('COMMIT');

    res.json({ message: 'Compteurs remis a zero.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  } finally {
    client.release();
  }
};

// Liste de tous les tickets
const tousLesTickets = async (req, res) => {
  try {
    await ensureTicketCategoryColumns(db);

    const [rows] = await db.query(`
      SELECT t.id, t.code_unique, t.ticket_type, t.prix_unitaire, t.statut, t.created_at, t.scanne_le,
             u.nom, u.prenom, u.email,
             i.nom as inspecteur_nom, i.prenom as inspecteur_prenom,
             e.nom as evenement_nom
      FROM tickets t
      JOIN users u ON t.client_id = u.id
      JOIN evenements e ON t.evenement_id = e.id
      LEFT JOIN users i ON t.scanne_par = i.id
      ORDER BY t.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Gérer l'événement
const mettreAJourEvenement = async (req, res) => {
  const { nom, description, date_evenement, lieu, prix_ticket, quantite_totale } = req.body;
  try {
    await db.query(
      `UPDATE evenements SET nom=?, description=?, date_evenement=?, lieu=?, prix_ticket=?, quantite_totale=? WHERE actif=true`,
      [nom, description, date_evenement, lieu, prix_ticket, quantite_totale]
    );
    res.json({ message: 'Événement mis à jour.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const obtenirEvenement = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM evenements WHERE actif = true LIMIT 1');
    res.json(rows[0] || null);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Créer un sous-admin (réservé à l'admin principal)
const creerSousAdmin = async (req, res) => {
  const { nom, prenom, email, password } = req.body;

  if (!nom || !prenom || !email || !password) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const [created] = await db.query(
      "INSERT INTO users (nom, prenom, email, password, role, created_by) VALUES (?, ?, ?, ?, 'sous_admin', ?) RETURNING id",
      [nom, prenom, email, hashed, req.user.id]
    );

    res.status(201).json({ message: 'Sous-admin créé avec succès.', id: created[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Liste des sous-admins
const listeSousAdmins = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nom, prenom, email, created_at FROM users WHERE role = 'sous_admin' ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Supprimer un sous-admin
const supprimerSousAdmin = async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id = ? AND role = 'sous_admin'", [req.params.id]);
    res.json({ message: 'Sous-admin supprimé.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { creerInspecteur, listeInspecteurs, supprimerInspecteur, statistiques, reinitialiserCompteurs, tousLesTickets, mettreAJourEvenement, obtenirEvenement, creerSousAdmin, listeSousAdmins, supprimerSousAdmin };
