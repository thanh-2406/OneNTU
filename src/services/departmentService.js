const db = require('../config/db');
const getPaginationFromRequest = require('../utils/paginate');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');

const DEFAULT_SORT = 'department_name';
const DEFAULT_ORDER = 'asc';
const ALLOWED_SORT_FIELDS = ['department_name', 'department_code'];

const createHttpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeDepartmentPayload = ({ department_name, department_code }) => {
  return {
    department_name: typeof department_name === 'string' ? department_name.trim() : '',
    department_code: typeof department_code === 'string' ? department_code.trim() : '',
  };
};

const getAllDepartments = async (queryParams = {}) => {
  const pagination = getPaginationFromRequest(
    { query: queryParams },
    {
      defaultSort: DEFAULT_SORT,
      defaultOrder: DEFAULT_ORDER,
      allowedSortFields: ALLOWED_SORT_FIELDS,
    }
  );

  const query = `
    SELECT *
    FROM departments
    WHERE is_active = true
    ORDER BY ${pagination.sort} ${pagination.order}
    LIMIT $1
    OFFSET $2
  `;

  const result = await db.query(query, [pagination.limit, pagination.offset]);

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

const createDepartment = async (departmentPayload) => {
  const { department_name, department_code } = normalizeDepartmentPayload(departmentPayload);

  if (!department_name || !department_code) {
    throw createHttpError(MESSAGES.REQUIRED_DEPARTMENT_FIELDS, HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const query = `
      INSERT INTO departments (department_name, department_code)
      VALUES ($1, $2)
      RETURNING *
    `;

    const result = await db.query(query, [department_name, department_code]);
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw createHttpError(MESSAGES.DEPARTMENT_CONFLICT, HTTP_STATUS.CONFLICT);
    }

    throw error;
  }
};

const getDepartmentById = async (id) => {
  const sql = `SELECT * FROM departments WHERE department_id = $1`;
  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
};

const updateDepartment = async (id, payload = {}) => {
  const normalized = normalizeDepartmentPayload(payload);
  const fields = [];
  const values = [];
  let idx = 1;

  if (normalized.department_name) {
    fields.push(`department_name = $${idx++}`);
    values.push(normalized.department_name);
  }
  if (normalized.department_code) {
    fields.push(`department_code = $${idx++}`);
    values.push(normalized.department_code);
  }
  if (payload.is_active !== undefined) {
    fields.push(`is_active = $${idx++}`);
    values.push(payload.is_active);
  }

  if (fields.length === 0) {
    throw createHttpError('No updatable fields provided', HTTP_STATUS.BAD_REQUEST);
  }

  const sql = `
    UPDATE departments
    SET ${fields.join(', ')}
    WHERE department_id = $${idx}
    RETURNING *
  `;

  values.push(id);

  try {
    const { rows } = await db.query(sql, values);
    return rows[0] || null;
  } catch (err) {
    if (err.code === '23505') {
      throw createHttpError(MESSAGES.DEPARTMENT_CONFLICT, HTTP_STATUS.CONFLICT);
    }
    throw err;
  }
};

const softDeleteDepartment = async (id) => {
  const sql = `
    UPDATE departments
    SET is_active = false
    WHERE department_id = $1
    RETURNING *
  `;

  const { rows } = await db.query(sql, [id]);
  return rows[0] || null;
};

const seedInitialDepartments = async () => {
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS departments (
      department_id SERIAL PRIMARY KEY,
      department_name VARCHAR(150) NOT NULL UNIQUE,
      department_code VARCHAR(20) NOT NULL UNIQUE,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await db.query(createTableSql);

  const { rows } = await db.query('SELECT COUNT(*)::int as count FROM departments');
  if (rows[0].count === 0) {
    const seeds = require('../config/constants').DEPARTMENT_SEEDS || [];
    if (seeds.length === 0) return;

    const placeholders = [];
    const values = [];

    seeds.forEach((d, index) => {
      const base = index * 3;
      placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3})`);
      values.push(d.name, d.code, d.is_active);
    });

    const sql = `
      INSERT INTO departments (department_name, department_code, is_active)
      VALUES ${placeholders.join(', ')}
    `;

    await db.query(sql, values);
  }
};

module.exports = {
  getAllDepartments,
  createDepartment,
  getDepartmentById,
  updateDepartment,
  softDeleteDepartment,
  seedInitialDepartments,
};
