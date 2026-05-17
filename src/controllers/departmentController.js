const departmentService = require('../services/departmentService');
const { HTTP_STATUS, MESSAGES, STATUS } = require('../config/constants');

// GET all active departments
const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await departmentService.getAllDepartments();
    res.status(HTTP_STATUS.OK).json({ status: STATUS.SUCCESS, data: departments });
  } catch (error) {
    next(error);
  }
};

// POST a new department
const createDepartment = async (req, res, next) => {
  const { department_name, department_code } = req.body;

  if (!department_name || !department_code) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ status: STATUS.ERROR, message: MESSAGES.REQUIRED_DEPARTMENT_FIELDS });
  }

  try {
    const department = await departmentService.createDepartment({ department_name, department_code });
    res.status(HTTP_STATUS.CREATED).json({ status: STATUS.SUCCESS, data: department });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllDepartments, createDepartment };