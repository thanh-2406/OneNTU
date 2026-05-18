const db = require('../config/db');
const { REQUEST_STATUSES, HTTP_STATUS, MESSAGES } = require('../config/constants');

const createHttpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const getAllStatuses = async ({ activeOnly = true } = {}) => {
  const whereClause = activeOnly ? 'WHERE is_active = true' : '';
  const sql = `SELECT * FROM request_statuses ${whereClause} ORDER BY display_order ASC`;
  const { rows } = await db.query(sql);
  return rows;
};

const getStatusById = async (id) => {
  const sql = `SELECT * FROM request_statuses WHERE request_status_id = $1`;
  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
};

const seedRequestStatuses = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS request_statuses (
      request_status_id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      description TEXT,
      display_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await db.query(createTableSql);

  const { rows } = await db.query('SELECT COUNT(*)::int as count FROM request_statuses');
  if (rows[0].count === 0) {
    const seeds = REQUEST_STATUSES;
    const values = [];
    const placeholders = [];

    seeds.forEach((s, i) => {
      const idx = i * 5;
      placeholders.push(`($${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5})`);
      values.push(s.name, s.code, s.description, s.display_order, s.is_active);
    });

    const insertSql = `
      INSERT INTO request_statuses (status_name, status_code, description, display_order, is_terminal)
      VALUES ${placeholders.join(', ')}
    `;

    await db.query(insertSql, values);
  }
};

module.exports = { getAllStatuses, getStatusById, seedRequestStatuses };
