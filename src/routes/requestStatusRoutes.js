const express = require('express');
const router = express.Router();
const requestStatusController = require('../controllers/requestStatusController');
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/statuses
router.get('/', authenticateToken, requestStatusController.listStatuses);

// GET /api/statuses/:id
router.get('/:id', authenticateToken, requestStatusController.getStatus);

module.exports = router;