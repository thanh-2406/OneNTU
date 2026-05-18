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
    departments: result.rows,
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

module.exports = {
  getAllDepartments,
  createDepartment,
};
