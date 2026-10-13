const db = require('../config/db');
const { ROYAL_COUPLE_CATEGORY, normalizeCouple } = require('../utils/voteCategories');
const { isVoteTabVisible } = require('../utils/voteTabSettings');

let voteTablesReady = false;

const ensureVoteTables = async () => {
  if (voteTablesReady) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS vote_couples (
      id serial PRIMARY KEY,
      roi_name varchar(150) NOT NULL,
      reine_name varchar(150) NOT NULL,
      roi_photo text,
      reine_photo text,
      description text,
      active boolean NOT NULL DEFAULT true,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    )
  `);

  await db.query('ALTER TABLE vote_couples ADD COLUMN IF NOT EXISTS roi_photo text');
  await db.query('ALTER TABLE vote_couples ADD COLUMN IF NOT EXISTS reine_photo text');

  await db.query(`
    CREATE TABLE IF NOT EXISTS votes (
      id serial PRIMARY KEY,
      client_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category varchar(80) NOT NULL,
      candidate varchar(150) NOT NULL,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      UNIQUE (client_id, category)
    )
  `);

  voteTablesReady = true;
};

const getActiveCouples = async () => {
  const [rows] = await db.query(`
    SELECT id, roi_name, reine_name, roi_photo, reine_photo, description, active, created_at
    FROM vote_couples
    WHERE active = true
    ORDER BY created_at ASC, id ASC
  `);
  return rows;
};

const getVoteRows = async () => {
  const [rows] = await db.query(
    `
      SELECT candidate, COUNT(*)::int AS total
      FROM votes
      WHERE category = ?
      GROUP BY candidate
    `,
    [ROYAL_COUPLE_CATEGORY.id]
  );
  return rows;
};

const formatCategory = (couples, voteRows = [], includeResults = false) => {
  const totalVotes = voteRows.reduce((sum, row) => sum + Number(row.total || 0), 0);

  return {
    ...ROYAL_COUPLE_CATEGORY,
    total: includeResults ? totalVotes : undefined,
    candidates: couples.map((couple) => {
      const candidate = normalizeCouple(couple);
      if (!includeResults) return candidate;

      const result = voteRows.find((row) => String(row.candidate) === candidate.id);
      const total = Number(result?.total || 0);
      return {
        ...candidate,
        total,
        percent: totalVotes > 0 ? Math.round((total / totalVotes) * 100) : 0
      };
    })
  };
};

const getMyVotesMap = async (clientId) => {
  const [rows] = await db.query('SELECT category, candidate FROM votes WHERE client_id = ?', [clientId]);
  return rows.reduce((acc, vote) => {
    acc[vote.category] = vote.candidate;
    return acc;
  }, {});
};

const obtenirVotes = async (req, res) => {
  try {
    await ensureVoteTables();
    const couples = await getActiveCouples();
    const my_votes = req.user.role === 'client' ? await getMyVotesMap(req.user.id) : {};

    res.json({
      categories: [formatCategory(couples, [], false)],
      my_votes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const obtenirStatutOngletVotePublic = async (req, res) => {
  try {
    res.json({ visible: await isVoteTabVisible(db) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const createRequireVisibleVoteTabForClient = (getVoteTabVisible) => async (req, res, next) => {
  try {
    if (req.user.role !== 'client') return next();

    const visible = await getVoteTabVisible();
    if (!visible) {
      return res.status(403).json({ message: 'L onglet Vote est actuellement masque.' });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const requireVisibleVoteTabForClient = createRequireVisibleVoteTabForClient(() => isVoteTabVisible(db));

const voter = async (req, res) => {
  const category = String(req.body?.category || '').trim();
  const candidate = String(req.body?.candidate || '').trim();

  if (category !== ROYAL_COUPLE_CATEGORY.id || !candidate) {
    return res.status(400).json({ message: 'Vote invalide.' });
  }

  try {
    await ensureVoteTables();
    const [couples] = await db.query(
      'SELECT id FROM vote_couples WHERE id = ? AND active = true',
      [Number(candidate)]
    );

    if (couples.length === 0) {
      return res.status(400).json({ message: 'Ce couple n est pas disponible pour le vote.' });
    }

    await db.query(
      `
        INSERT INTO votes (client_id, category, candidate, updated_at)
        VALUES (?, ?, ?, now())
        ON CONFLICT (client_id, category)
        DO UPDATE SET candidate = EXCLUDED.candidate, updated_at = now()
      `,
      [req.user.id, ROYAL_COUPLE_CATEGORY.id, String(couples[0].id)]
    );

    res.json({
      message: 'Vote enregistre.',
      category: ROYAL_COUPLE_CATEGORY.id,
      candidate: String(couples[0].id)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const obtenirResultatsVotes = async (req, res) => {
  try {
    await ensureVoteTables();
    const couples = await getActiveCouples();
    const voteRows = await getVoteRows();

    res.json({ results: [formatCategory(couples, voteRows, true)] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const creerCoupleVote = async (req, res) => {
  const roiName = String(req.body?.roi_name || '').trim();
  const reineName = String(req.body?.reine_name || '').trim();
  const description = String(req.body?.description || '').trim();
  const roiPhoto = String(req.body?.roi_photo || '').trim();
  const reinePhoto = String(req.body?.reine_photo || '').trim();

  if (!roiName || !reineName) {
    return res.status(400).json({ message: 'Le roi et la reine sont obligatoires pour creer un couple.' });
  }

  try {
    await ensureVoteTables();
    const [rows] = await db.query(
      `
        INSERT INTO vote_couples (roi_name, reine_name, roi_photo, reine_photo, description, active, updated_at)
        VALUES (?, ?, ?, ?, ?, true, now())
        RETURNING id, roi_name, reine_name, roi_photo, reine_photo, description, active, created_at
      `,
      [roiName, reineName, roiPhoto || null, reinePhoto || null, description || null]
    );

    res.status(201).json({
      message: 'Couple ajoute aux votes.',
      couple: normalizeCouple(rows[0])
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

const supprimerCoupleVote = async (req, res) => {
  const coupleId = Number(req.params.id);

  if (!Number.isInteger(coupleId) || coupleId <= 0) {
    return res.status(400).json({ message: 'Couple invalide.' });
  }

  try {
    await ensureVoteTables();
    await db.query('DELETE FROM votes WHERE category = ? AND candidate = ?', [ROYAL_COUPLE_CATEGORY.id, String(coupleId)]);
    const [, result] = await db.query('DELETE FROM vote_couples WHERE id = ?', [coupleId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Couple introuvable.' });
    }

    res.json({ message: 'Couple supprime des votes.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  obtenirVotes,
  voter,
  obtenirStatutOngletVotePublic,
  createRequireVisibleVoteTabForClient,
  requireVisibleVoteTabForClient,
  obtenirResultatsVotes,
  creerCoupleVote,
  supprimerCoupleVote
};
