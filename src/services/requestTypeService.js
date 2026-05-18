const db = require('../config/db');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');
const getPaginationFromRequest = require('../utils/paginate');

const DEFAULT_SORT = 'type_name';
const DEFAULT_ORDER = 'asc';
const ALLOWED_SORT_FIELDS = ['type_name', 'type_code'];

const createHttpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizePayload = ({ name, code, description }) => ({
  name: typeof name === 'string' ? name.trim() : '',
  code: typeof code === 'string' ? code.trim() : '',
  description: typeof description === 'string' ? description.trim() : null,
});

const getAllRequestTypes = async (queryParams = {}) => {
  const pagination = getPaginationFromRequest(
    { query: queryParams },
    {
      defaultSort: DEFAULT_SORT,
      defaultOrder: DEFAULT_ORDER,
      allowedSortFields: ALLOWED_SORT_FIELDS,
    }
  );

  const sql = `
    SELECT *
    FROM request_types
    WHERE is_active = true
    ORDER BY ${pagination.sort} ${pagination.order}
    LIMIT $1
    OFFSET $2
  `;

  const result = await db.query(sql, [pagination.limit, pagination.offset]);

  return {
    data: result.rows,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      offset: pagination.offset,
      sort: pagination.sort,
      order: pagination.order,
    },
  };
};

const getRequestTypeById = async (id) => {
  const sql = `SELECT * FROM request_types WHERE type_id = $1 AND is_active = true`;
  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
};

const createRequestType = async (payload) => {
  const { name, code, description } = normalizePayload(payload);

  if (!name || !code) {
    throw createHttpError(MESSAGES.REQUIRED_DEPARTMENT_FIELDS, HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const sql = `
      INSERT INTO request_types (type_name, type_code, description)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const { rows } = await db.query(sql, [name, code, description]);
    return rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw createHttpError('Request type already exists', HTTP_STATUS.CONFLICT);
    }
    throw error;
  }
};

const updateRequestType = async (id, payload) => {
  const fields = [];
  const values = [];
  let idx = 1;

  const normalized = normalizePayload(payload);

  if (normalized.name) {
    fields.push(`type_name = $${idx++}`);
    values.push(normalized.name);
  }
  if (normalized.code) {
    fields.push(`type_code = $${idx++}`);
    values.push(normalized.code);
  }
  if (payload.description !== undefined) {
    fields.push(`description = $${idx++}`);
    values.push(normalized.description);
  }
  if (payload.is_active !== undefined) {
    fields.push(`is_active = $${idx++}`);
    values.push(payload.is_active);
  }

  if (fields.length === 0) {
    throw createHttpError('No updatable fields provided', HTTP_STATUS.BAD_REQUEST);
  }

  const sql = `
    UPDATE request_types
    SET ${fields.join(', ')}
    WHERE type_id = $${idx}
    RETURNING *
  `;

  values.push(id);

  const { rows } = await db.query(sql, values);
  return rows[0] || null;
};

const softDeleteRequestType = async (id) => {
  const sql = `
    UPDATE request_types
    SET is_active = false
    WHERE type_id = $1
    RETURNING *
  `;

  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
};

// Seeder: create table if not exists and insert initial rows if empty
const seedInitialRequestTypes = async () => {
  // ensure table exists (id autoincrement)
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS request_types (
      type_id SERIAL PRIMARY KEY,
      type_name VARCHAR(150) NOT NULL UNIQUE,
      type_code VARCHAR(30) NOT NULL UNIQUE,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await db.query(createTableSql);

  const { rows } = await db.query('SELECT COUNT(*)::int as count FROM request_types');
  if (rows[0].count === 0) {
    const insertSql = `
      INSERT INTO request_types (type_name, type_code, description)
      VALUES
        ('General Request', 'GENERAL', 'General requests not covered by specific types'),
        ('Maintenance', 'MAINT', 'Maintenance related requests'),
        ('IT Support', 'IT', 'IT support and software requests')
      RETURNING *
    `;

    await db.query(insertSql);
  }
};

module.exports = {
  getAllRequestTypes,
  getRequestTypeById,
  createRequestType,
  updateRequestType,
  softDeleteRequestType,
  seedInitialRequestTypes,
};