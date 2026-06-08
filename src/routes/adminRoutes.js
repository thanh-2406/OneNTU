const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');
const {
  createStudentSchema,
  createStaffSchema,
  updateStudentSchema,
  updateStaffSchema,
  listStudentsSchema,
  getStudentSchema,
  listStaffSchema,
  getStaffSchema,
  forceLogoutAllSchema,
} = require('../validations/adminValidation');

const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

// GET /admin/students
router.get(
  '/students',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(listStudentsSchema),
  adminController.listStudents
);

// GET /admin/students/:id
router.get(
  '/students/:id',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(getStudentSchema),
  adminController.getStudent
);

// PATCH /admin/students/:id
router.patch(
  '/students/:id',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(updateStudentSchema),
  adminController.updateStudent
);

// PATCH /admin/students/:id/deactivate
router.patch(
  '/students/:id/deactivate',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(getStudentSchema),
  adminController.deactivateStudent
);

// PATCH /admin/students/:id/activate
router.patch(
  '/students/:id/activate',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(getStudentSchema),
  adminController.activateStudent
);

// POST /admin/students/:id/reset-password
router.post(
  '/students/:id/reset-password',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(getStudentSchema),
  adminController.resetStudentPassword
);

// GET /admin/staff
router.get(
  '/staff',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(listStaffSchema),
  adminController.listStaff
);

// GET /admin/staff/:id
router.get(
  '/staff/:id',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(getStaffSchema),
  adminController.getStaff
);

// PATCH /admin/staff/:id
router.patch(
  '/staff/:id',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(updateStaffSchema),
  adminController.updateStaff
);

// PATCH /admin/staff/:id/deactivate
router.patch(
  '/staff/:id/deactivate',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(getStaffSchema),
  adminController.deactivateStaff
);

// PATCH /admin/staff/:id/activate
router.patch(
  '/staff/:id/activate',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(getStaffSchema),
  adminController.activateStaff
);

// POST /admin/staff/:id/reset-password
router.post(
  '/staff/:id/reset-password',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(getStaffSchema),
  adminController.resetStaffPassword
);

// POST /admin/students
router.post(
  '/students',
  authenticateToken,           // protect middleware (attach req.user)
  requireRole(['admin']),      // ensure only admins can access
  validateRequest(createStudentSchema), // validate payload
  adminController.createStudent
);

// POST /admin/staff
router.post(
  '/staff',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(createStaffSchema),
  adminController.createStaff
);

// POST /admin/auth/logout-all
router.post(
  '/auth/logout-all',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(forceLogoutAllSchema),
  authController.forceLogoutAll
);

module.exports = router;
