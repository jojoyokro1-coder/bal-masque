const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { TICKET_CATEGORIES, normalizeTicketType, ensureTicketCategoryColumns } = require('../utils/ticketCategories');
const { normalizeEventInfo } = require('../utils/eventInfo');

const DELAI_COMMANDE_MS = 2 * 60 * 1000; // 2 minutes
const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const DEFAULT_PAYMENT_LINKS = {
  solo: 'https://pay.jeko.africa/pl/c78ebe8c-a33c-4fe5-b049-245430647df5',
  couple: 'https://pay.jeko.africa/pl/a90a5ca4-08d1-4825-baed-d7c60cbc0464'
};
const PAYMENTS_DISABLED_MESSAGE = 'Les paiements sont temporairement suspendus. Veuillez reessayer plus tard.';

const getPaymentLink = (ticketType, prixUnitaire) => {
  const key = `PAYMENT_LINK_${String(ticketType || '').toUpperCase()}`;
  return process.env[key] || process.env.PAYMENT_LINK_DEFAULT || DEFAULT_PAYMENT_LINKS[ticketType] || DEFAULT_PAYMENT_LINKS.solo;
};

const extraireCodeTicket = (valeur) => {
  if (typeof valeur !== 'string') return '';

  const texte = valeur.trim();
  if (!texte) return '';

  try {
    const payload = JSON.parse(texte);
    if (payload?.ticket) return extraireCodeTicket(String(payload.ticket));
    if (payload?.code_unique) return extraireCodeTicket(String(payload.code_unique));
  } catch {
    // Le code manuel est souvent un UUID brut, pas un JSON.
  }

  return texte.match(UUID_REGEX)?.[0].toLowerCase() || texte.toLowerCase();
};

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
// Acheter des tickets
const acheterTickets = async (req, res) => {
  const { evenement_id, quantite } = req.body;
  const ticket_type = normalizeTicketType(req.body.ticket_type || req.body.categorie_ticket);
  const client_id = req.user.id;

  if (!evenement_id || !quantite || quantite < 1) {
    return res.status(400).json({ message: 'Données invalides.' });
  }

  if (!ticket_type) {
    return res.status(400).json({ message: 'Categorie de ticket invalide.' });
  }

  try {
    const { arePaymentsDisabled } = require('../utils/paymentSettings');
    if (await arePaymentsDisabled(db)) {
      return res.status(403).json({ message: PAYMENTS_DISABLED_MESSAGE });
    }

    await ensureTicketCategoryColumns(db);

    // Vérifier le délai de 2 minutes depuis la dernière commande
    const [dernieres] = await db.query(
      `SELECT created_at FROM commandes 
       WHERE client_id = ? AND statut != 'annulee'
       ORDER BY created_at DESC LIMIT 1`,
      [client_id]
    );

    if (dernieres.length > 0) {
      const derniere = new Date(dernieres[0].created_at);
      const maintenant = new Date();
      const diff = maintenant - derniere;

      if (diff < DELAI_COMMANDE_MS) {
        const resteMs = DELAI_COMMANDE_MS - diff;
        const resteSec = Math.ceil(resteMs / 1000);
        return res.status(429).json({
          message: `Veuillez attendre encore ${resteSec} seconde(s) avant une nouvelle commande.`,
          resteSecondes: resteSec
        });
      }
    }

    // Vérifier disponibilité
    const [evenements] = await db.query(
      'SELECT * FROM evenements WHERE id = ? AND actif = true',
      [evenement_id]
    );

    if (evenements.length === 0) {
      return res.status(404).json({ message: 'Événement introuvable.' });
    }

    const evenement = evenements[0];

    if (evenement.quantite_disponible < quantite) {
      return res.status(400).json({
        message: `Seulement ${evenement.quantite_disponible} ticket(s) disponible(s).`
      });
    }

    const categorie = TICKET_CATEGORIES[ticket_type];
    const prix_unitaire = categorie.prix;
    const montant_total = prix_unitaire * quantite;
    const payment_url = getPaymentLink(ticket_type, prix_unitaire);

    if (!payment_url) {
      return res.status(500).json({
        message: `Lien de paiement manquant pour la categorie ${categorie.label}.`
      });
    }

    // Créer la commande
    const [commandeRows] = await db.query(
      "INSERT INTO commandes (client_id, evenement_id, quantite, montant_total, ticket_type, prix_unitaire, statut) VALUES (?, ?, ?, ?, ?, ?, 'en_attente') RETURNING id",
      [client_id, evenement_id, quantite, montant_total, ticket_type, prix_unitaire]
    );

    const commande_id = commandeRows[0].id;

    // Ne pas générer les tickets ni valider le paiement ici.
    // L'utilisateur sera redirigé vers Jeko.

    res.status(201).json({
      message: `Commande de ${quantite} ticket(s) créée. En attente de paiement.`,
      commande_id,
      montant_total,
      ticket_type,
      prix_unitaire,
      payment_url
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Valider le paiement et générer les tickets
const validerPaiement = async (req, res) => {
  const { commande_id } = req.body;
  const client_id = req.user.id;

  if (!commande_id) {
    return res.status(400).json({ message: 'ID de commande requis.' });
  }

  try {
    await ensureTicketCategoryColumns(db);

    const [commandes] = await db.query(
      'SELECT * FROM commandes WHERE id = ? AND client_id = ?',
      [commande_id, client_id]
    );

    if (commandes.length === 0) {
      return res.status(404).json({ message: 'Commande introuvable.' });
    }

    const commande = commandes[0];

    if (commande.statut === 'payee') {
      return res.status(200).json({ message: 'Commande déjà payée.' });
    }

    // Générer les tickets avec QR codes
    const ticketsGeneres = [];

    for (let i = 0; i < commande.quantite; i++) {
      const code_unique = uuidv4();
      const payload = JSON.stringify({
        ticket: code_unique,
        evenement: commande.evenement_id,
        client: client_id,
        categorie: commande.ticket_type
      });

      const qr_code_data = await QRCode.toDataURL(payload, {
        errorCorrectionLevel: 'H',
        width: 300,
        margin: 2
      });

      const [ticketRows] = await db.query(
        'INSERT INTO tickets (commande_id, client_id, evenement_id, code_unique, qr_code_data, ticket_type, prix_unitaire) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
        [commande_id, client_id, commande.evenement_id, code_unique, qr_code_data, commande.ticket_type, commande.prix_unitaire]
      );

      ticketsGeneres.push({ id: ticketRows[0].id, code_unique, qr_code_data, ticket_type: commande.ticket_type, prix_unitaire: commande.prix_unitaire });
    }

    // Mettre à jour le statut
    await db.query("UPDATE commandes SET statut = 'payee' WHERE id = ?", [commande_id]);

    res.status(200).json({
      message: 'Paiement validé, tickets générés.',
      tickets: ticketsGeneres
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Mes tickets (client)
const mesTickets = async (req, res) => {
  try {
    await ensureTicketCategoryColumns(db);

    const [rows] = await db.query(`
      SELECT t.id, t.code_unique, t.qr_code_data, t.ticket_type, t.prix_unitaire, t.statut, t.created_at,
             e.nom as evenement_nom, e.date_evenement, e.lieu, e.prix_ticket,
             c.quantite, c.montant_total
      FROM tickets t
      JOIN evenements e ON t.evenement_id = e.id
      JOIN commandes c ON t.commande_id = c.id
      WHERE t.client_id = ?
      ORDER BY t.created_at DESC
    `, [req.user.id]);

    res.json(rows.map(normalizeEventInfo));
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Mes commandes (client)
const mesCommandes = async (req, res) => {
  try {
    await ensureTicketCategoryColumns(db);

    const [rows] = await db.query(`
      SELECT c.*, e.nom as evenement_nom, e.date_evenement
      FROM commandes c
      JOIN evenements e ON c.evenement_id = e.id
      WHERE c.client_id = ?
      ORDER BY c.created_at DESC
    `, [req.user.id]);

    // Vérifier s'il reste du délai
    let resteSecondes = 0;
    if (rows.length > 0) {
      const derniere = new Date(rows[0].created_at);
      const diff = Date.now() - derniere;
      if (diff < DELAI_COMMANDE_MS) {
        resteSecondes = Math.ceil((DELAI_COMMANDE_MS - diff) / 1000);
      }
    }

    res.json({ commandes: rows.map(normalizeEventInfo), resteSecondes });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Scanner un ticket (inspecteur)
const scannerTicket = async (req, res) => {
  const code_unique = extraireCodeTicket(req.body.code_unique);

  if (!code_unique) {
    return res.status(400).json({ message: 'Code ticket requis.' });
  }

  try {
    await ensureTicketCategoryColumns(db);

    const [tickets] = await db.query(
      'SELECT * FROM tickets WHERE LOWER(code_unique) = ?',
      [code_unique]
    );

    if (tickets.length === 0) {
      return res.status(404).json({ valide: false, message: 'Ticket introuvable.' });
    }

    const ticket = tickets[0];

    if (ticket.statut === 'utilise') {
      const [scanInfo] = await db.query(
        `SELECT u.nom, u.prenom, t.scanne_le 
         FROM tickets t JOIN users u ON t.scanne_par = u.id 
         WHERE t.id = ?`,
        [ticket.id]
      );
      return res.status(200).json({
        valide: false,
        message: 'Ce ticket a déjà été scanné.',
        details: scanInfo[0] || null
      });
    }

    if (ticket.statut === 'annule') {
      return res.status(200).json({ valide: false, message: 'Ce ticket est annulé.' });
    }

    // Marquer comme utilisé
    await db.query(
      "UPDATE tickets SET statut = 'utilise', scanne_par = ?, scanne_le = NOW() WHERE id = ?",
      [req.user.id, ticket.id]
    );

    // Récupérer infos client
    const [clientInfo] = await db.query(
      'SELECT nom, prenom, email FROM users WHERE id = ?',
      [ticket.client_id]
    );

    res.json({
      valide: true,
      message: 'Ticket valide. Entrée autorisée !',
      client: clientInfo[0],
      ticket: {
        code_unique: ticket.code_unique,
        ticket_type: ticket.ticket_type,
        prix_unitaire: ticket.prix_unitaire
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// Infos événement public
const obtenirEvenementPublic = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nom, description, date_evenement, lieu, prix_ticket, quantite_disponible FROM evenements WHERE actif = true LIMIT 1'
    );
    const evenement = rows[0] || null;
    res.json(evenement ? {
      ...normalizeEventInfo(evenement),
      categories_tickets: TICKET_CATEGORIES
    } : null);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const validerPaiementAvecPromotion = async (req, res) => {
  const { commande_id } = req.body;
  const client_id = req.user.id;

  if (!commande_id) {
    return res.status(400).json({ message: 'ID de commande requis.' });
  }

  try {
    const { arePaymentsDisabled } = require('../utils/paymentSettings');
    if (await arePaymentsDisabled(db)) {
      return res.status(403).json({ message: PAYMENTS_DISABLED_MESSAGE });
    }

    await ensureTicketCategoryColumns(db);

    const client = await db.pool.connect();

    try {
      const txDb = createTransactionalDb(client);

      await client.query('BEGIN');

      const [commandes] = await txDb.query(
        'SELECT * FROM commandes WHERE id = ? AND client_id = ? FOR UPDATE',
        [commande_id, client_id]
      );

      if (commandes.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Commande introuvable.' });
      }

      const commande = commandes[0];

      if (commande.statut === 'payee') {
        await client.query('ROLLBACK');
        return res.status(200).json({ message: 'Commande deja payee.' });
      }

      await txDb.query('SELECT pg_advisory_xact_lock(?)', [Number(commande.evenement_id)]);

      const montantTotal = Number(commande.prix_unitaire) * Number(commande.quantite);
      const ticketsGeneres = [];

      for (let i = 0; i < commande.quantite; i++) {
        const code_unique = uuidv4();
        const prixUnitaireTicket = commande.prix_unitaire;
        const payload = JSON.stringify({
          ticket: code_unique,
          evenement: commande.evenement_id,
          client: client_id,
          categorie: commande.ticket_type
        });

        const qr_code_data = await QRCode.toDataURL(payload, {
          errorCorrectionLevel: 'H',
          width: 300,
          margin: 2
        });

        const [ticketRows] = await txDb.query(
          'INSERT INTO tickets (commande_id, client_id, evenement_id, code_unique, qr_code_data, ticket_type, prix_unitaire) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id',
          [commande_id, client_id, commande.evenement_id, code_unique, qr_code_data, commande.ticket_type, prixUnitaireTicket]
        );

        ticketsGeneres.push({
          id: ticketRows[0].id,
          code_unique,
          qr_code_data,
          ticket_type: commande.ticket_type,
          prix_unitaire: prixUnitaireTicket
        });
      }

      await txDb.query(
        "UPDATE commandes SET statut = 'payee', montant_total = ?, prix_unitaire = ? WHERE id = ?",
        [montantTotal, ticketsGeneres[0]?.prix_unitaire ?? commande.prix_unitaire, commande_id]
      );

      await client.query('COMMIT');

      res.status(200).json({
        message: 'Paiement valide, tickets generes.',
        montant_total: montantTotal,
        tickets: ticketsGeneres
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  acheterTickets,
  validerPaiement: validerPaiementAvecPromotion,
  mesTickets,
  mesCommandes,
  scannerTicket,
  obtenirEvenementPublic
};
