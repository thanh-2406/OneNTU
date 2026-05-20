const departmentService = require('../services/departmentService');
const { sendPaginatedResponse, sendSuccess } = require('../utils/response');
const { HTTP_STATUS } = require('../config/constants');

// GET all active departments
const getAllDepartments = async (req, res, next) => {
  try {
    const { data, meta } = await departmentService.getAllDepartments(req.query);
    return sendPaginatedResponse(res, data, meta, 'Departments retrieved successfully', HTTP_STATUS.OK);
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

// PATCH update department
const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const department = await departmentService.updateDepartment(id, req.body);
    return sendSuccess(res, department, 'Department updated successfully', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// DELETE (soft) department
const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const department = await departmentService.softDeleteDepartment(id);
    return sendSuccess(res, department, 'Department deleted (soft) successfully', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllDepartments, createDepartment, updateDepartment, deleteDepartment };