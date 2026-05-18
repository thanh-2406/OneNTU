const db = require('../config/db');
const { PROGRAMME_SEEDS, HTTP_STATUS, MESSAGES } = require('../config/constants');
const getPaginationFromRequest = require('../utils/paginate');

const DEFAULT_SORT = 'programme_name';
const DEFAULT_ORDER = 'asc';
const ALLOWED_SORT_FIELDS = ['programme_name', 'programme_code'];

const createHttpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const normalizePayload = (payload = {}) => ({
  name: typeof payload.name === 'string' ? payload.name.trim() : '',
  code: typeof payload.code === 'string' ? payload.code.trim() : '',
  school_id: Number(payload.school_id),
  is_active: typeof payload.is_active === 'boolean' ? payload.is_active : true,
});

const ensureSchoolExists = async (school_id) => {
  const sql = `SELECT school_id FROM schools WHERE school_id = $1 AND is_active = true`;
  const { rows } = await db.query(sql, [school_id]);
  if (rows.length === 0) {
    throw createHttpError(MESSAGES.INVALID_SCHOOL_ID, HTTP_STATUS.BAD_REQUEST);
  }
};

const getAllProgrammes = async (queryParams = {}) => {
  const pagination = getPaginationFromRequest(
    { query: queryParams },
    {
      defaultSort: DEFAULT_SORT,
      defaultOrder: DEFAULT_ORDER,
      allowedSortFields: ALLOWED_SORT_FIELDS,
    }
  );

  const filters = ['p.is_active = true'];
  const values = [];
  let idx = 1;

  if (queryParams.school_id) {
    filters.push(`p.school_id = $${idx++}`);
    values.push(Number(queryParams.school_id));
  }

  const sql = `
    SELECT p.*
    FROM programmes p
    WHERE ${filters.join(' AND ')}
    ORDER BY ${pagination.sort} ${pagination.order}
    LIMIT $${idx++}
    OFFSET $${idx}
  `;

  values.push(pagination.limit, pagination.offset);

  const { rows } = await db.query(sql, values);

  return {
    data: rows,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      offset: pagination.offset,
      sort: pagination.sort,
      order: pagination.order,
      school_id: queryParams.school_id ? Number(queryParams.school_id) : undefined,
    },
  };
};

const getProgrammeById = async (id) => {
  const sql = `SELECT * FROM programmes WHERE programme_id = $1 AND is_active = true`;
  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
};

const createProgramme = async (payload) => {
  const { name, code, description, school_id, is_active } = normalizePayload(payload);

  if (!name || !code || !school_id) {
    throw createHttpError(MESSAGES.REQUIRED_PROGRAMME_FIELDS, HTTP_STATUS.BAD_REQUEST);
  }

  await ensureSchoolExists(school_id);

  try {
    const sql = `
      INSERT INTO programmes (programme_name, programme_code, school_id, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const { rows } = await db.query(sql, [name, code, school_id, is_active]);
    return rows[0];
  } catch (err) {
    if (err.code === '23505') {
      throw createHttpError(MESSAGES.PROGRAMME_CONFLICT, HTTP_STATUS.CONFLICT);
    }
    throw err;
  }
};

const updateProgramme = async (id, payload) => {
  const normalized = normalizePayload(payload);
  const fields = [];
  const values = [];
  let idx = 1;

  if (normalized.name) {
    fields.push(`programme_name = $${idx++}`);
    values.push(normalized.name);
  }
  if (normalized.code) {
    fields.push(`programme_code = $${idx++}`);
    values.push(normalized.code);
  }
  if (payload.school_id) {
    await ensureSchoolExists(normalized.school_id);
    fields.push(`school_id = $${idx++}`);
    values.push(normalized.school_id);
  }
  if (payload.is_active !== undefined) {
    fields.push(`is_active = $${idx++}`);
    values.push(payload.is_active);
  }

  if (fields.length === 0) {
    throw createHttpError('No updatable fields provided', HTTP_STATUS.BAD_REQUEST);
  }

  const sql = `
    UPDATE programmes
    SET ${fields.join(', ')}
    WHERE programme_id = $${idx}
    RETURNING *
  `;

  values.push(id);

  const { rows } = await db.query(sql, values);
  return rows[0] || null;
};

const softDeleteProgramme = async (id) => {
  const sql = `
    UPDATE programmes
    SET is_active = false
    WHERE programme_id = $1
    RETURNING *
  `;

  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
};

const seedInitialProgrammes = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS programmes (
      programme_id SERIAL PRIMARY KEY,
      school_id INT NOT NULL REFERENCES schools(school_id) ON DELETE RESTRICT,
      programme_name VARCHAR(200) NOT NULL,
      programme_code VARCHAR(20) NOT NULL UNIQUE,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (school_id, programme_name)
    )
  `;

  await db.query(createTableSql);

  const { rows } = await db.query('SELECT COUNT(*)::int as count FROM programmes');
  if (rows[0].count === 0) {
    const seeds = PROGRAMME_SEEDS;
    const placeholders = [];
    const values = [];

    for (let i = 0; i < seeds.length; i += 1) {
      const seed = seeds[i];
      placeholders.push(`($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`);
      values.push(seed.name, seed.code, seed.school_code, seed.is_active);
    }

    const sql = `
      WITH selected_schools AS (
        SELECT school_id, school_code FROM schools WHERE school_code = ANY($1)
      )
      INSERT INTO programmes (programme_name, programme_code, school_id, is_active)
      SELECT s.name, s.code, sc.school_id, s.is_active
      FROM (
        SELECT UNNEST($2::text[]) AS name,
               UNNEST($3::text[]) AS code,
               UNNEST($4::text[]) AS school_code,
               UNNEST($5::boolean[]) AS is_active
      ) AS s
      JOIN schools sc ON sc.school_code = s.school_code
    `;

    const names = seeds.map((seed) => seed.name);
    const codes = seeds.map((seed) => seed.code);
    const schoolCodes = seeds.map((seed) => seed.school_code);
    const isActives = seeds.map((seed) => seed.is_active);

    await db.query(sql, [schoolCodes, names, codes, schoolCodes, isActives]);
  }
};

module.exports = {
  getAllProgrammes,
  getProgrammeById,
  createProgramme,
  updateProgramme,
  softDeleteProgramme,
  seedInitialProgrammes,
};