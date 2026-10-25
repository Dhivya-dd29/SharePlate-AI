const express = require('express');
const router = express.Router();
const pickupController = require('../controllers/pickupController');
const { validateClaimRequest } = require('../middleware/validator');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', pickupController.getAllClaims);
router.post('/claim', authenticateToken, requireRole('RECIPIENT', 'ADMIN'), validateClaimRequest, pickupController.createClaim);
router.patch('/claim/:id/status', authenticateToken, pickupController.updateClaimStatus);

module.exports = router;
