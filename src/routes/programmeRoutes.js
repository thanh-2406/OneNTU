const express = require('express');
const router = express.Router();
const programmeController = require('../controllers/programmeController');
const { createProgrammeSchema, updateProgrammeSchema, getProgrammesSchema } = require('../validations/programmeValidation');
const { validateRequest } = require('../middleware/validateMiddleware');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, validateRequest(getProgrammesSchema), programmeController.listProgrammes);
router.get('/:id', authenticateToken, programmeController.getProgramme);
router.post('/', authenticateToken, requireRole(['admin']), validateRequest(createProgrammeSchema), programmeController.createProgramme);
router.patch('/:id', authenticateToken, requireRole(['admin']), validateRequest(updateProgrammeSchema), programmeController.updateProgramme);
router.delete('/:id', authenticateToken, requireRole(['admin']), programmeController.deleteProgramme);

module.exports = router;