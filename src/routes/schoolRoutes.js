const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const { createSchoolSchema, updateSchoolSchema } = require('../validations/schoolValidation');
const { validateRequest } = require('../middleware/validateMiddleware');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, schoolController.listSchools);
router.get('/:id', authenticateToken, schoolController.getSchool);
router.post('/', authenticateToken, requireRole(['admin']), validateRequest(createSchoolSchema), schoolController.createSchool);
router.patch('/:id', authenticateToken, requireRole(['admin']), validateRequest(updateSchoolSchema), schoolController.updateSchool);
router.delete('/:id', authenticateToken, requireRole(['admin']), schoolController.deleteSchool);

module.exports = router;