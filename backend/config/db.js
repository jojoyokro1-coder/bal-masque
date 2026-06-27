const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 10
});

const toPostgresQuery = (sql) => {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
};

module.exports = {
  query: async (sql, params = []) => {
    const result = await pool.query(toPostgresQuery(sql), params);
    return [result.rows, result];
  },
  pool
};
