const express = require('express');
const router = express.Router();
const impactController = require('../controllers/impactController');

router.get('/dashboard', impactController.getDashboardStats);
router.get('/audit-logs', impactController.getAuditLogs);

module.exports = router;
