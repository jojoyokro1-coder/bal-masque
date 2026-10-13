const TICKET_CATEGORIES = {
  solo: { label: 'Solo', prix: 8000 },
  couple: { label: 'Couple', prix: 12000 }
};

let ticketCategoryColumnsReady = false;

const normalizeTicketType = (value) => {
  const type = String(value || 'solo').trim().toLowerCase();
  return TICKET_CATEGORIES[type] ? type : null;
};

const ensureTicketCategoryColumns = async (db) => {
  if (ticketCategoryColumnsReady) return;

  await db.query("ALTER TABLE commandes ADD COLUMN IF NOT EXISTS ticket_type varchar(20) NOT NULL DEFAULT 'solo'");
  await db.query("ALTER TABLE commandes ADD COLUMN IF NOT EXISTS prix_unitaire numeric(10, 2) NOT NULL DEFAULT 7000");
  await db.query("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_type varchar(20) NOT NULL DEFAULT 'solo'");
  await db.query("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS prix_unitaire numeric(10, 2) NOT NULL DEFAULT 7000");

  ticketCategoryColumnsReady = true;
};

module.exports = { TICKET_CATEGORIES, normalizeTicketType, ensureTicketCategoryColumns };
