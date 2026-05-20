const express = require('express');
const router = express.Router();

const specialisationController = require('../controllers/specialisationController');
const { createSpecialisationSchema, updateSpecialisationSchema } = require('../validations/specialisationValidation');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateMiddleware');

// GET all (any authenticated user)
router.get('/', authenticateToken, specialisationController.getAllSpecialisations);

// POST create (admin only)
router.post('/', authenticateToken, requireRole(['admin']), validateRequest(createSpecialisationSchema), specialisationController.createSpecialisation);

// PATCH update (admin only)
router.patch('/:id', authenticateToken, requireRole(['admin']), validateRequest(updateSpecialisationSchema), specialisationController.updateSpecialisation);

// DELETE soft (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), specialisationController.deleteSpecialisation);

module.exports = router;
