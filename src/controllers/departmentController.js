const departmentService = require('../services/departmentService');
const { httpStatus, messages, status } = require('../config/constants');

// GET all active departments
const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await departmentService.getAllDepartments();
    res.status(httpStatus.OK).json({ status: status.SUCCESS, data: departments });
  } catch (error) {
    next(error);
  }
};

// POST a new department
const createDepartment = async (req, res, next) => {
  const { department_name, department_code } = req.body;

  if (!department_name || !department_code) {
    return res.status(httpStatus.BAD_REQUEST).json({ status: status.ERROR, message: messages.REQUIRED_DEPARTMENT_FIELDS });
  }

  try {
    const department = await departmentService.createDepartment({ department_name, department_code });
    res.status(201).json({ status: 'success', data: department });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllDepartments, createDepartment };