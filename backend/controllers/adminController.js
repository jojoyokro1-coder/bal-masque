const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { ensureTicketCategoryColumns } = require('../utils/ticketCategories');
const { isClientAuthDisabled, setClientAuthDisabled } = require('../utils/clientAuthSettings');
const { arePaymentsDisabled, setPaymentsDisabled } = require('../utils/paymentSettings');
const { isVoteTabVisible, setVoteTabVisible } = require('../utils/voteTabSettings');
const { EVENT_DATE_ISO, EVENT_LOCATION, normalizeEventInfo } = require('../utils/eventInfo');

const toPostgresQuery = (sql) => {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
};

const createTransactionalDb = (client) => ({
  query: async (sql, params = []) => {
    const result = await client.query(toPostgresQuery(sql), params);
    return [result.rows, result];
  }
});

const genererTicketsPourCommande = async (txDb, commande) => {
  const ticketsGeneres = [];

  for (let i = 0; i < Number(commande.quantite); i++) {
    const code_unique = uuidv4();
    const payload = JSON.stringify({
      ticket: code_unique,
      evenement: commande.evenement_id,
      client: commande.client_id,
      categorie: commande.ticket_type
    });

    const qr_code_data = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      width: 300,
      margin: 2
    });

    const [ticketRows] = await txDb.query(
      'INSERT INTO tickets (commande_id, client_id, evenement_id, code_unique, qr_code_data, ticket_type, prix_unitaire) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
      [commande.id, commande.client_id, commande.evenement_id, code_unique, qr_code_data, commande.ticket_type, commande.prix_unitaire]
    );

    ticketsGeneres.push({
      id: ticketRows[0].id,
      code_unique,
      ticket_type: commande.ticket_type,
      prix_unitaire: commande.prix_unitaire
    });
  }

  return ticketsGeneres;
};

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

    // Tickets par catégorie
    const [[{ ticketsSolo }]] = await db.query("SELECT COUNT(*)::int as \"ticketsSolo\" FROM tickets WHERE ticket_type = 'solo'");
    const [[{ ticketsCouple }]] = await db.query("SELECT COUNT(*)::int as \"ticketsCouple\" FROM tickets WHERE ticket_type = 'couple'");

    res.json({
      totalTickets,
      ticketsScanned,
      ticketsActifs: totalTickets - ticketsScanned,
      totalVentes,
      totalClients,
      ticketsSolo,
      ticketsCouple,
      evenement: normalizeEventInfo(evenement[0] || null)
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
  const { nom, description, prix_ticket, quantite_totale } = req.body;
  try {
    await db.query(
      `UPDATE evenements SET nom=?, description=?, date_evenement=?, lieu=?, prix_ticket=?, quantite_totale=? WHERE actif=true`,
      [nom, description, EVENT_DATE_ISO, EVENT_LOCATION, prix_ticket, quantite_totale]
    );
    res.json({ message: 'Événement mis à jour.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const obtenirEvenement = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM evenements WHERE actif = true LIMIT 1');
    res.json(normalizeEventInfo(rows[0] || null));
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

// Liste de tous les clients
const listeClients = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nom, prenom, email, created_at FROM users WHERE role = 'client' ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Réinitialiser le mot de passe d'un client
const reinitialiserMotDePasseClient = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 6 caractères.' });
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    const [result] = await db.query(
      "UPDATE users SET password = ? WHERE id = ? AND role = 'client'",
      [hashed, id]
    );
    res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const obtenirStatutAuthClients = async (req, res) => {
  try {
    res.json({ disabled: await isClientAuthDisabled(db) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const mettreAJourStatutAuthClients = async (req, res) => {
  const disabled = req.body?.disabled;

  if (typeof disabled !== 'boolean') {
    return res.status(400).json({ message: 'Le champ disabled doit etre un booleen.' });
  }

  try {
    await setClientAuthDisabled(db, disabled);
    res.json({
      disabled,
      message: disabled
        ? 'Inscriptions et connexions client bloquees.'
        : 'Inscriptions et connexions client debloquees.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const obtenirStatutPaiements = async (req, res) => {
  try {
    res.json({ disabled: await arePaymentsDisabled(db) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const mettreAJourStatutPaiements = async (req, res) => {
  const disabled = req.body?.disabled;

  if (typeof disabled !== 'boolean') {
    return res.status(400).json({ message: 'Le champ disabled doit etre un booleen.' });
  }

  try {
    await setPaymentsDisabled(db, disabled);
    res.json({
      disabled,
      message: disabled
        ? 'Paiements bloques.'
        : 'Paiements debloques.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const toutesLesCommandes = async (req, res) => {
  try {
    await ensureTicketCategoryColumns(db);

    const [rows] = await db.query(`
      SELECT c.id, c.quantite, c.ticket_type, c.prix_unitaire, c.montant_total, c.statut,
             c.reference_paiement, c.created_at, c.updated_at,
             u.nom, u.prenom, u.email,
             e.nom as evenement_nom,
             COUNT(t.id)::int as tickets_generes
      FROM commandes c
      JOIN users u ON c.client_id = u.id
      JOIN evenements e ON c.evenement_id = e.id
      LEFT JOIN tickets t ON t.commande_id = c.id
      GROUP BY c.id, u.nom, u.prenom, u.email, e.nom
      ORDER BY c.created_at DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const validerCommandePayee = async (req, res) => {
  const commandeId = Number(req.params.id);
  const referencePaiement = String(req.body?.reference_paiement || '').trim() || null;

  if (!commandeId) {
    return res.status(400).json({ message: 'Commande invalide.' });
  }

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');
    const txDb = createTransactionalDb(client);

    const [commandes] = await txDb.query('SELECT * FROM commandes WHERE id = ? FOR UPDATE', [commandeId]);
    if (commandes.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Commande introuvable.' });
    }

    const commande = commandes[0];
    const [ticketsExistants] = await txDb.query('SELECT COUNT(*)::int as total FROM tickets WHERE commande_id = ?', [commandeId]);

    if (Number(ticketsExistants[0]?.total || 0) > 0) {
      await txDb.query(
        'UPDATE commandes SET statut = ?, reference_paiement = COALESCE(?, reference_paiement) WHERE id = ?',
        ['payee', referencePaiement, commandeId]
      );
      await client.query('COMMIT');
      return res.json({ message: 'Commande deja validee.', tickets: [] });
    }

    const ticketsGeneres = await genererTicketsPourCommande(txDb, commande);

    await txDb.query(
      'UPDATE commandes SET statut = ?, reference_paiement = COALESCE(?, reference_paiement) WHERE id = ?',
      ['payee', referencePaiement, commandeId]
    );
    await txDb.query(
      'UPDATE evenements SET quantite_disponible = GREATEST(quantite_disponible - ?, 0) WHERE id = ?',
      [commande.quantite, commande.evenement_id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Paiement valide, tickets generes.', tickets: ticketsGeneres });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  } finally {
    client.release();
  }
};

const obtenirStatutOngletVote = async (req, res) => {
  try {
    res.json({ visible: await isVoteTabVisible(db) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const mettreAJourStatutOngletVote = async (req, res) => {
  const visible = req.body?.visible;

  if (typeof visible !== 'boolean') {
    return res.status(400).json({ message: 'Le champ visible doit etre un booleen.' });
  }

  try {
    await setVoteTabVisible(db, visible);
    res.json({
      visible,
      message: visible
        ? 'Onglet Vote active avec succes.'
        : 'Onglet Vote desactive avec succes.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  creerInspecteur,
  listeInspecteurs,
  supprimerInspecteur,
  statistiques,
  reinitialiserCompteurs,
  tousLesTickets,
  toutesLesCommandes,
  validerCommandePayee,
  mettreAJourEvenement,
  obtenirEvenement,
  creerSousAdmin,
  listeSousAdmins,
  supprimerSousAdmin,
  listeClients,
  reinitialiserMotDePasseClient,
  obtenirStatutAuthClients,
  mettreAJourStatutAuthClients,
  obtenirStatutPaiements,
  mettreAJourStatutPaiements,
  obtenirStatutOngletVote,
  mettreAJourStatutOngletVote
};
