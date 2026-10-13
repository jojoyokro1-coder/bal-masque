const SETTING_KEY = 'vote_tab_visible';

let ensured = false;

const ensureSettingsTable = async (db) => {
  if (ensured) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key varchar(100) PRIMARY KEY,
      value text NOT NULL,
      updated_at timestamp with time zone DEFAULT now()
    )
  `);

  ensured = true;
};

const isVoteTabVisible = async (db) => {
  try {
    await ensureSettingsTable(db);

    const [rows] = await db.query('SELECT value FROM app_settings WHERE key = ?', [SETTING_KEY]);
    if (rows.length === 0) return true;

    return rows[0].value !== 'false';
  } catch (err) {
    console.error('Erreur dans isVoteTabVisible:', err);
    return true;
  }
};

const setVoteTabVisible = async (db, visible) => {
  await ensureSettingsTable(db);

  await db.query(
    `
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, now())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `,
    [SETTING_KEY, visible ? 'true' : 'false']
  );

  return visible;
};

module.exports = { SETTING_KEY, isVoteTabVisible, setVoteTabVisible };
