const express = require('express');
const router = express.Router();
const requestTypeController = require('../controllers/requestTypeController');
const { createRequestTypeSchema, updateRequestTypeSchema } = require('../validations/requestTypeValidation');
const { validateRequest } = require('../middleware/validateMiddleware');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// GET /api/request-types
router.get('/', authenticateToken, requestTypeController.getAll);

// GET /api/request-types/:id
router.get('/:id', authenticateToken, requestTypeController.getById);

// POST /api/request-types (admin)
router.post('/', authenticateToken, requireRole(['admin']), validateRequest(createRequestTypeSchema), requestTypeController.create);

// PATCH /api/request-types/:id (admin)
router.patch('/:id', authenticateToken, requireRole(['admin']), validateRequest(updateRequestTypeSchema), requestTypeController.update);

// DELETE /api/request-types/:id (admin) - soft delete
router.delete('/:id', authenticateToken, requireRole(['admin']), requestTypeController.remove);

module.exports = router;