const express = require('express');
const router = express.Router();
const documentTypeController = require('../controllers/documentTypeController');
const { createDocumentTypeSchema, updateDocumentTypeSchema } = require('../validations/documentTypeValidation');
const { validateRequest } = require('../middleware/validateMiddleware');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// GET all (authenticated users)
router.get('/', authenticateToken, documentTypeController.list);

// GET by id (authenticated users)
router.get('/:id', authenticateToken, documentTypeController.getById);

// POST (admin only)
router.post('/', authenticateToken, requireRole(['admin']), validateRequest(createDocumentTypeSchema), documentTypeController.create);

// PATCH (admin only)
router.patch('/:id', authenticateToken, requireRole(['admin']), validateRequest(updateDocumentTypeSchema), documentTypeController.update);

// DELETE (soft delete) (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), documentTypeController.remove);

module.exports = router;