const db = require('../config/db');
const { httpStatus, messages } = require('../config/constants');

const getAllDepartments = async () => {
  const result = await db.query(
    'SELECT * FROM departments WHERE is_active = true ORDER BY department_name ASC'
  );
  return result.rows;
};

const createDepartment = async ({ department_name, department_code }) => {
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
      const conflictError = new Error(messages.DEPARTMENT_CONFLICT);
      conflictError.statusCode = httpStatus.CONFLICT;
      throw conflictError;
    }

    throw error;
  }
};

module.exports = {
  getAllDepartments,
  createDepartment,
};
