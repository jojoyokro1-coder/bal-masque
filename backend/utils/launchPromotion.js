const SOLO_ORIGINAL_PRICE = 7000;
const FREE_BUYER_RANK = 1;
const EARLY_BIRD_START_RANK = 2;
const EARLY_BIRD_END_RANK = 5;
const EARLY_BIRD_PRICE = 7000;

const PROMO_BADGES = {
  free: '🎉 Ticket Offert · Premier acheteur',
  earlyBird: '🔥 Offre Early Bird · -28%'
};

let promotionColumnsReady = false;

const ensureLaunchPromotionColumns = async (db) => {
  if (promotionColumnsReady) return;

  await db.query("ALTER TABLE commandes ADD COLUMN IF NOT EXISTS promotion_details jsonb");
  await db.query("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS rang_acheteur integer");
  await db.query("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS promotion_badge varchar(120)");

  promotionColumnsReady = true;
};

const getConfirmedSoloTicketCount = async (dbOrClient, evenementId) => {
  const [rows] = await dbOrClient.query(
    `SELECT COUNT(*)::int as count
     FROM tickets t
     JOIN commandes c ON c.id = t.commande_id
     WHERE t.ticket_type = 'solo'
       AND t.statut != 'annule'
       AND c.statut = 'payee'
       AND t.evenement_id = ?`,
    [evenementId]
  );

  return Number(rows[0]?.count || 0);
};

const getSoloPromotionForRank = (rank) => {
  if (rank === FREE_BUYER_RANK) {
    return {
      rank,
      prix_unitaire: 0,
      prix_original: SOLO_ORIGINAL_PRICE,
      promotion_badge: PROMO_BADGES.free
    };
  }

  if (rank >= EARLY_BIRD_START_RANK && rank <= EARLY_BIRD_END_RANK) {
    return {
      rank,
      prix_unitaire: EARLY_BIRD_PRICE,
      prix_original: SOLO_ORIGINAL_PRICE,
      promotion_badge: PROMO_BADGES.earlyBird
    };
  }

  return {
    rank,
    prix_unitaire: SOLO_ORIGINAL_PRICE,
    prix_original: SOLO_ORIGINAL_PRICE,
    promotion_badge: null
  };
};

const buildSoloPromotionQuote = (confirmedSoloCount, quantity = 1) => {
  const tickets = Array.from({ length: Number(quantity || 0) }, (_, index) =>
    getSoloPromotionForRank(confirmedSoloCount + index + 1)
  );

  return {
    original_price: SOLO_ORIGINAL_PRICE,
    early_bird_price: EARLY_BIRD_PRICE,
    free_remaining: confirmedSoloCount < FREE_BUYER_RANK ? 1 : 0,
    early_bird_remaining: Math.max(0, EARLY_BIRD_END_RANK - Math.max(confirmedSoloCount, FREE_BUYER_RANK)),
    limited_stock_remaining: Math.max(0, EARLY_BIRD_END_RANK - confirmedSoloCount),
    next_rank: confirmedSoloCount + 1,
    tickets,
    total: tickets.reduce((sum, ticket) => sum + ticket.prix_unitaire, 0)
  };
};

const buildPromotionSummary = (confirmedSoloCount) => ({
  solo: buildSoloPromotionQuote(confirmedSoloCount, 1)
});

module.exports = {
  SOLO_ORIGINAL_PRICE,
  EARLY_BIRD_PRICE,
  ensureLaunchPromotionColumns,
  getConfirmedSoloTicketCount,
  getSoloPromotionForRank,
  buildSoloPromotionQuote,
  buildPromotionSummary
};
