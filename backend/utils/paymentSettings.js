const SETTING_KEY = 'payments_disabled';

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

const arePaymentsDisabled = async (db) => {
  try {
    await ensureSettingsTable(db);

    const [rows] = await db.query('SELECT value FROM app_settings WHERE key = ?', [SETTING_KEY]);
    if (rows.length === 0) return false;

    return rows[0].value === 'true';
  } catch (err) {
    console.error('Erreur dans arePaymentsDisabled:', err);
    return false;
  }
};

const setPaymentsDisabled = async (db, disabled) => {
  await ensureSettingsTable(db);

  await db.query(
    `
      INSERT INTO app_settings (key, value, updated_at)
      VALUES (?, ?, now())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `,
    [SETTING_KEY, disabled ? 'true' : 'false']
  );

  return disabled;
};

module.exports = { arePaymentsDisabled, setPaymentsDisabled };
