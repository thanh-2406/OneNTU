const departmentService = require('../services/departmentService');
const { sendPaginatedResponse, sendSuccess } = require('../utils/response');
const { HTTP_STATUS } = require('../config/constants');

// GET all active departments
const getAllDepartments = async (req, res, next) => {
  try {
    const { departments, meta } = await departmentService.getAllDepartments(req.query);
    return sendPaginatedResponse(res, departments, meta, 'Departments retrieved successfully', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// POST a new department
const createDepartment = async (req, res, next) => {
  try {
    const department = await departmentService.createDepartment(req.body);
    return sendSuccess(res, department, 'Department created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllDepartments, createDepartment };