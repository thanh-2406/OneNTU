const db = require('../config/db');
const { DOCUMENT_TYPES, HTTP_STATUS, MESSAGES, PAGINATION } = require('../config/constants');
const getPaginationFromRequest = require('../utils/paginate');

const DEFAULT_SORT = 'type_name';
const DEFAULT_ORDER = 'asc';
const ALLOWED_SORT_FIELDS = ['type_name'];

const createHttpError = (message, statusCode) => {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
};

const normalizePayload = (payload = {}) => {
  const type_name = typeof payload.type_name === 'string' ? payload.type_name.trim() : (typeof payload.name === 'string' ? payload.name.trim() : '');
  const description = typeof payload.description === 'string' ? payload.description.trim() : null;
  const is_active = typeof payload.is_active === 'boolean' ? payload.is_active : true;
  return { type_name, description, is_active };
};

const getAllDocumentTypes = async (queryParams = {}) => {
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
    FROM document_types
    WHERE is_active = true
    ORDER BY ${pagination.sort} ${pagination.order}
    LIMIT $1
    OFFSET $2
  `;

  const { rows } = await db.query(sql, [pagination.limit, pagination.offset]);

  return {
    data: rows,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      offset: pagination.offset,
      sort: pagination.sort,
      order: pagination.order,
    },
  };
};

const getDocumentTypeById = async (id) => {
  const sql = `SELECT * FROM document_types WHERE document_type_id = $1 AND is_active = true`;
  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
};

const createDocumentType = async (payload) => {
  const { type_name, description, is_active } = normalizePayload(payload);

  if (!type_name) {
    throw createHttpError('Document type name is required', HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const sql = `
      INSERT INTO document_types (type_name, description, is_active)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const { rows } = await db.query(sql, [type_name, description, is_active]);
    return rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw createHttpError('Document type already exists', HTTP_STATUS.CONFLICT);
    }
    throw err;
  }
};

const updateDocumentType = async (id, payload) => {
  const fields = [];
  const values = [];
  let idx = 1;

  const normalized = normalizePayload(payload);

  if (normalized.type_name) {
    fields.push(`type_name = $${idx++}`);
    values.push(normalized.type_name);
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
    UPDATE document_types
    SET ${fields.join(', ')}
    WHERE document_type_id = $${idx}
    RETURNING *
  `;

  values.push(id);

  const { rows } = await db.query(sql, values);
  return rows[0] || null;
};

const softDeleteDocumentType = async (id) => {
  const sql = `
    UPDATE document_types
    SET is_active = false
    WHERE document_type_id = $1
    RETURNING *
  `;

  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
};

const seedInitialDocumentTypes = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS document_types (
      document_type_id SERIAL PRIMARY KEY,
      type_name VARCHAR(100) NOT NULL,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await db.query(createTableSql);

  const { rows } = await db.query('SELECT COUNT(*)::int as count FROM document_types');
  if (rows[0].count === 0) {
    const seeds = DOCUMENT_TYPES;
    const values = [];
    const placeholders = [];

    seeds.forEach((s, i) => {
      const idx = i * 3;
      placeholders.push(`($${idx + 1}, $${idx + 2}, $${idx + 3})`);
      values.push(s.name, s.description, s.is_active);
    });

    const insertSql = `
      INSERT INTO document_types (type_name, description, is_active)
      VALUES ${placeholders.join(', ')}
    `;

    await db.query(insertSql, values);
  }
};

module.exports = {
  getAllDocumentTypes,
  getDocumentTypeById,
  createDocumentType,
  updateDocumentType,
  softDeleteDocumentType,
  seedInitialDocumentTypes,
};