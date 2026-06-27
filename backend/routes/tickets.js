const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const {
  acheterTickets, mesTickets, mesCommandes,
  scannerTicket, obtenirEvenementPublic, validerPaiement
} = require('../controllers/ticketController');

// Public
router.get('/evenement', obtenirEvenementPublic);

// Client
router.post('/acheter', authMiddleware, roleMiddleware('client'), acheterTickets);
router.post('/valider-paiement', authMiddleware, roleMiddleware('client'), validerPaiement);
router.get('/mes-tickets', authMiddleware, roleMiddleware('client'), mesTickets);
router.get('/mes-commandes', authMiddleware, roleMiddleware('client'), mesCommandes);

// Inspecteur
router.post('/scanner', authMiddleware, roleMiddleware('inspecteur', 'admin'), scannerTicket);

module.exports = router;
