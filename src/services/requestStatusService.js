const db = require('../config/db');
const { REQUEST_STATUSES, HTTP_STATUS, MESSAGES } = require('../config/constants');

const createHttpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const getAllStatuses = async () => {
  const sql = `SELECT * FROM request_statuses ORDER BY display_order ASC`;
  const { rows } = await db.query(sql);
  return rows;
};

const getStatusById = async (id) => {
  const sql = `SELECT * FROM request_statuses WHERE status_id = $1`;
  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
};

const seedRequestStatuses = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS request_statuses (
      status_id SERIAL PRIMARY KEY,
      status_name VARCHAR(100) NOT NULL UNIQUE,
      status_code VARCHAR(30) NOT NULL UNIQUE,
      description TEXT,
      is_terminal BOOLEAN NOT NULL DEFAULT false,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
      values.push(s.name, s.code, s.description, s.display_order, s.is_terminal);
    });

    const insertSql = `
      INSERT INTO request_statuses (status_name, status_code, description, display_order, is_terminal)
      VALUES ${placeholders.join(', ')}
    `;

    await db.query(insertSql, values);
  }
};

module.exports = { getAllStatuses, getStatusById, seedRequestStatuses };
