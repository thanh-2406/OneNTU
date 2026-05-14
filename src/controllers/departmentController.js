const db = require('../config/db');

// GET all active departments
const getAllDepartments = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM departments WHERE is_active = true ORDER BY department_name ASC');
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    next(error); // Passes to your global error handler
  }
};

// POST a new department
const createDepartment = async (req, res, next) => {
  try {
    const { department_name, department_code } = req.body;
    
    const query = `
      INSERT INTO departments (department_name, department_code) 
      VALUES ($1, $2) RETURNING *`;
      
    const result = await db.query(query, [department_name, department_code]);
    
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (error) {
    // If Postgres throws a unique constraint error (e.g., code already exists), handle it cleanly
    if (error.code === '23505') {
      return res.status(409).json({ status: 'error', message: 'Department name or code already exists.' });
    }
    next(error);
  }
};

module.exports = { getAllDepartments, createDepartment };