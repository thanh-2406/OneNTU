const departmentService = require('../services/departmentService');
const { sendSuccess, sendError } = require('../utils/response');
const { HTTP_STATUS, MESSAGES } = require('../config/constants');

// GET all active departments
const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await departmentService.getAllDepartments();
    return sendSuccess(res, departments, 'Departments retrieved successfully', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// POST a new department
const createDepartment = async (req, res, next) => {
  const { department_name, department_code } = req.body;

  if (!department_name || !department_code) {
    return sendError(res, MESSAGES.REQUIRED_DEPARTMENT_FIELDS, HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const department = await departmentService.createDepartment({ department_name, department_code });
    return sendSuccess(res, department, 'Department created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllDepartments, createDepartment };