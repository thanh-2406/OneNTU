const adminService = require('../services/adminService');
const { sendSuccess, sendPaginatedResponse } = require('../utils/response');
const { HTTP_STATUS } = require('../config/constants');

// POST /admin/students
const createStudent = async (req, res, next) => {
  try {
    // Controller is intentionally thin: it trusts validation middleware and auth middleware
    const payload = req.body; // validated by src/validations/adminValidation.js
    const adminId = req.user && req.user.id;

    const { student } = await adminService.createStudent(payload, adminId);

    return sendSuccess(res, student, 'Student account created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

// GET /admin/students
const listStudents = async (req, res, next) => {
  try {
    const query = req.query; // validated by src/validations/adminValidation.js
    const { students, meta } = await adminService.getStudents(query);

    return sendPaginatedResponse(res, students, meta, 'Students retrieved successfully', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// GET /admin/students/:id
const getStudent = async (req, res, next) => {
  try {
    const studentId = Number(req.params.id); // validated by src/validations/adminValidation.js
    const student = await adminService.getStudentById(studentId);

    return sendSuccess(res, student, 'Student profile retrieved successfully', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// PATCH /admin/students/:id
const updateStudent = async (req, res, next) => {
  try {
    const studentId = Number(req.params.id); // validated by src/validations/adminValidation.js
    const payload = req.body;
    const student = await adminService.updateStudent(studentId, payload);

    return sendSuccess(res, student, 'Student updated successfully', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// PATCH /admin/students/:id/deactivate
const deactivateStudent = async (req, res, next) => {
  try {
    const studentId = Number(req.params.id);
    const student = await adminService.deactivateStudent(studentId);

    return sendSuccess(res, student, 'Student deactivated successfully', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// PATCH /admin/students/:id/activate
const activateStudent = async (req, res, next) => {
  try {
    const studentId = Number(req.params.id);
    const student = await adminService.activateStudent(studentId);

    return sendSuccess(res, student, 'Student activated successfully', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// POST /admin/students/:id/reset-password
const resetStudentPassword = async (req, res, next) => {
  try {
    const studentId = Number(req.params.id);
    const { student, tempPassword } = await adminService.resetStudentPassword(studentId);

    const response = {
      ...student,
      tempPassword,
    };

    return sendSuccess(res, response, 'Student password reset successfully', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// GET /admin/staff
const listStaff = async (req, res, next) => {
  try {
    const query = req.query; // validated by src/validations/adminValidation.js
    const { staff, meta } = await adminService.getStaffs(query);

    return sendPaginatedResponse(res, staff, meta, 'Staff retrieved successfully', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// GET /admin/staff/:id
const getStaff = async (req, res, next) => {
  try {
    const staffId = Number(req.params.id); // validated by src/validations/adminValidation.js
    const staff = await adminService.getStaffById(staffId);

    return sendSuccess(res, staff, 'Staff profile retrieved successfully', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// PATCH /admin/staff/:id
const updateStaff = async (req, res, next) => {
  try {
    const staffId = Number(req.params.id); // validated by src/validations/adminValidation.js
    const payload = req.body;
    const staff = await adminService.updateStaff(staffId, payload);

    return sendSuccess(res, staff, 'Staff updated successfully', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// PATCH /admin/staff/:id/deactivate
const deactivateStaff = async (req, res, next) => {
  try {
    const staffId = Number(req.params.id);
    const staff = await adminService.deactivateStaff(staffId);

    return sendSuccess(res, staff, 'Staff deactivated successfully', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// PATCH /admin/staff/:id/activate
const activateStaff = async (req, res, next) => {
  try {
    const staffId = Number(req.params.id);
    const staff = await adminService.activateStaff(staffId);

    return sendSuccess(res, staff, 'Staff activated successfully', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// POST /admin/staff/:id/reset-password
const resetStaffPassword = async (req, res, next) => {
  try {
    const staffId = Number(req.params.id);
    const { staff, tempPassword } = await adminService.resetStaffPassword(staffId);

    const response = {
      ...staff,
      tempPassword,
    };

    return sendSuccess(res, response, 'Staff password reset successfully', HTTP_STATUS.OK);
  } catch (error) {
    next(error);
  }
};

// POST /admin/staff
const createStaff = async (req, res, next) => {
  try {
    const payload = req.body; // validated by src/validations/adminValidation.js
    const adminId = req.user && req.user.id;

    const { staff } = await adminService.createStaff(payload, adminId);

    return sendSuccess(res, staff, 'Staff account created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createStudent,
  listStudents,
  getStudent,
  updateStudent,
  deactivateStudent,
  activateStudent,
  resetStudentPassword,
  listStaff,
  getStaff,
  updateStaff,
  deactivateStaff,
  activateStaff,
  resetStaffPassword,
  createStaff,
};
