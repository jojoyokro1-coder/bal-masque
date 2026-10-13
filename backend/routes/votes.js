const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const {
  obtenirVotes,
  voter,
  obtenirStatutOngletVotePublic,
  requireVisibleVoteTabForClient,
  obtenirResultatsVotes,
  creerCoupleVote,
  supprimerCoupleVote
} = require('../controllers/voteController');

const router = express.Router();

router.use(authMiddleware);

router.get('/status', roleMiddleware('client', 'admin', 'sous_admin'), obtenirStatutOngletVotePublic);
router.get('/', roleMiddleware('client', 'admin', 'sous_admin'), requireVisibleVoteTabForClient, obtenirVotes);
router.post('/', roleMiddleware('client'), requireVisibleVoteTabForClient, voter);
router.get('/results', roleMiddleware('admin', 'sous_admin'), obtenirResultatsVotes);
router.post('/couples', roleMiddleware('admin'), creerCoupleVote);
router.delete('/couples/:id', roleMiddleware('admin'), supprimerCoupleVote);

module.exports = router;
