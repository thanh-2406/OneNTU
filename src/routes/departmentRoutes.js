const express = require('express');
const router = express.Router();

// Import your newly created files
const departmentController = require('../controllers/departmentController');
const { createDepartmentSchema, updateDepartmentSchema } = require('../validations/departmentValidation');

// Import your middleware
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

// 1. Public or Student/Staff route (Anyone logged in can view departments)
router.get('/', authenticateToken, departmentController.getAllDepartments);

// 2. Protected Admin-only route (Requires admin role + data validation)
router.post(
  '/', 
  authenticateToken, 
  requireRole(['admin']), 
  validateRequest(createDepartmentSchema), 
  departmentController.createDepartment
);

// PATCH update (admin only)
router.patch(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(updateDepartmentSchema),
  departmentController.updateDepartment
);

// DELETE (soft) (admin only)
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  departmentController.deleteDepartment
);

module.exports = router;