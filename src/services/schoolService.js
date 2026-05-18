const db = require('../config/db');
const { SCHOOL_SEEDS, HTTP_STATUS, MESSAGES } = require('../config/constants');
const getPaginationFromRequest = require('../utils/paginate');

const DEFAULT_SORT = 'name';
const DEFAULT_ORDER = 'asc';
const ALLOWED_SORT_FIELDS = ['name', 'code'];

const createHttpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const normalizePayload = (payload = {}) => ({
  name: typeof payload.name === 'string' ? payload.name.trim() : '',
  code: typeof payload.code === 'string' ? payload.code.trim() : '',
  description: typeof payload.description === 'string' ? payload.description.trim() : null,
  is_active: typeof payload.is_active === 'boolean' ? payload.is_active : true,
});

const getAllSchools = async (queryParams = {}) => {
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
    FROM schools
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

const getSchoolById = async (id) => {
  const sql = `SELECT * FROM schools WHERE school_id = $1 AND is_active = true`;
  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
};

const createSchool = async (payload) => {
  const { name, code, description, is_active } = normalizePayload(payload);

  if (!name || !code) {
    throw createHttpError(MESSAGES.REQUIRED_SCHOOL_FIELDS, HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const sql = `
      INSERT INTO schools (name, code, description, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const { rows } = await db.query(sql, [name, code, description, is_active]);
    return rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw createHttpError(MESSAGES.SCHOOL_CONFLICT, HTTP_STATUS.CONFLICT);
    }
    throw err;
  }
};

const updateSchool = async (id, payload) => {
  const normalized = normalizePayload(payload);
  const fields = [];
  const values = [];
  let idx = 1;

  if (normalized.name) {
    fields.push(`name = $${idx++}`);
    values.push(normalized.name);
  }
  if (normalized.code) {
    fields.push(`code = $${idx++}`);
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
    UPDATE schools
    SET ${fields.join(', ')}
    WHERE school_id = $${idx}
    RETURNING *
  `;

  values.push(id);

  const { rows } = await db.query(sql, values);
  return rows[0] || null;
};

const softDeleteSchool = async (id) => {
  const sql = `
    UPDATE schools
    SET is_active = false
    WHERE school_id = $1
    RETURNING *
  `;

  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
};

const seedInitialSchools = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS schools (
      school_id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL UNIQUE,
      code VARCHAR(20) NOT NULL UNIQUE,
      description TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await db.query(createTableSql);

  const { rows } = await db.query('SELECT COUNT(*)::int as count FROM schools');
  if (rows[0].count === 0) {
    const seeds = SCHOOL_SEEDS;
    const placeholders = [];
    const values = [];

    seeds.forEach((school, index) => {
      const base = index * 4;
      placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
      values.push(school.name, school.code, school.description, school.is_active);
    });

    const sql = `
      INSERT INTO schools (school_name, school_code, description, is_active)
      VALUES ${placeholders.join(', ')}
    `;

    await db.query(sql, values);
  }
};

module.exports = {
  getAllSchools,
  getSchoolById,
  createSchool,
  updateSchool,
  softDeleteSchool,
  seedInitialSchools,
};