const db = require('../config/db');
const getPaginationFromRequest = require('../utils/paginate');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');

const DEFAULT_SORT = 'specialisation_name';
const DEFAULT_ORDER = 'asc';
const ALLOWED_SORT_FIELDS = ['specialisation_name'];

const createHttpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const normalizePayload = (payload = {}) => ({
  specialisation_name: typeof payload.specialisation_name === 'string' ? payload.specialisation_name.trim() : '',
  description: typeof payload.description === 'string' ? payload.description.trim() : null,
  is_active: typeof payload.is_active === 'boolean' ? payload.is_active : true,
});

const getAllSpecialisations = async (queryParams = {}) => {
  const pagination = getPaginationFromRequest(
    { query: queryParams },
    { defaultSort: DEFAULT_SORT, defaultOrder: DEFAULT_ORDER, allowedSortFields: ALLOWED_SORT_FIELDS }
  );

  const sql = `
    SELECT *
    FROM specialisations
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

const getSpecialisationById = async (id) => {
  const sql = `SELECT * FROM specialisations WHERE specialisation_id = $1`;
  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
};

const createSpecialisation = async (payload) => {
  const { specialisation_name, description, is_active } = normalizePayload(payload);

  if (!specialisation_name) {
    throw createHttpError(MESSAGES.REQUIRED_SPECIALISATION_FIELDS, HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const sql = `
      INSERT INTO specialisations (specialisation_name, description, is_active)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const { rows } = await db.query(sql, [specialisation_name, description, is_active]);
    return rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw createHttpError(MESSAGES.SPECIALISATION_CONFLICT, HTTP_STATUS.CONFLICT);
    }
    throw err;
  }
};

const updateSpecialisation = async (id, payload = {}) => {
  const normalized = normalizePayload(payload);
  const fields = [];
  const values = [];
  let idx = 1;

  if (normalized.specialisation_name) {
    fields.push(`specialisation_name = $${idx++}`);
    values.push(normalized.specialisation_name);
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
    UPDATE specialisations
    SET ${fields.join(', ')}
    WHERE specialisation_id = $${idx}
    RETURNING *
  `;

  values.push(id);

  try {
    const { rows } = await db.query(sql, values);
    return rows[0] || null;
  } catch (err) {
    if (err.code === '23505') {
      throw createHttpError(MESSAGES.SPECIALISATION_CONFLICT, HTTP_STATUS.CONFLICT);
    }
    throw err;
  }
};

const softDeleteSpecialisation = async (id) => {
  const sql = `
    UPDATE specialisations
    SET is_active = false
    WHERE specialisation_id = $1
    RETURNING *
  `;

  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
};

const seedInitialSpecialisations = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS specialisations (
      specialisation_id SERIAL PRIMARY KEY,
      specialisation_name VARCHAR(150) NOT NULL UNIQUE,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await db.query(createTableSql);

  const { rows } = await db.query('SELECT COUNT(*)::int as count FROM specialisations');
  if (rows[0].count === 0) {
    const seeds = require('../config/constants').SPECIALISATION_SEEDS || [];
    if (seeds.length === 0) return;

    const placeholders = [];
    const values = [];

    seeds.forEach((s, index) => {
      const base = index * 3;
      placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
      values.push(s.name, s.description || null, s.is_active);
    });

    const sql = `
      INSERT INTO specialisations (specialisation_name, description, is_active)
      VALUES ${placeholders.join(', ')}
    `;

    await db.query(sql, values);
  }
};

module.exports = {
  getAllSpecialisations,
  getSpecialisationById,
  createSpecialisation,
  updateSpecialisation,
  softDeleteSpecialisation,
  seedInitialSpecialisations,
};
