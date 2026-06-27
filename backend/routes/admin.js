const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const {
  creerInspecteur, listeInspecteurs, supprimerInspecteur,
  statistiques, reinitialiserCompteurs, tousLesTickets, mettreAJourEvenement, obtenirEvenement,
  creerSousAdmin, listeSousAdmins, supprimerSousAdmin
} = require('../controllers/adminController');

// Routes accessibles à admin ET sous_admin
router.use(authMiddleware, roleMiddleware('admin', 'sous_admin'));

router.get('/statistiques', statistiques);
router.post('/reinitialiser-compteurs', reinitialiserCompteurs);
router.get('/tickets', tousLesTickets);
router.get('/evenement', obtenirEvenement);
router.put('/evenement', mettreAJourEvenement);

// Inspecteurs : lecture accessible aux deux rôles, écriture réservée à l'admin
router.get('/inspecteurs', listeInspecteurs);
router.post('/inspecteurs', roleMiddleware('admin'), creerInspecteur);
router.delete('/inspecteurs/:id', roleMiddleware('admin'), supprimerInspecteur);

// Sous-admins : gestion réservée à l'admin principal uniquement
router.get('/sous-admins', roleMiddleware('admin'), listeSousAdmins);
router.post('/sous-admins', roleMiddleware('admin'), creerSousAdmin);
router.delete('/sous-admins/:id', roleMiddleware('admin'), supprimerSousAdmin);

module.exports = router;
