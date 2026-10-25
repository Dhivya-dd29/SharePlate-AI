const express = require('express');
const router = express.Router();
const recipientController = require('../controllers/recipientController');
const { validateRecipientProfile } = require('../middleware/validator');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', recipientController.getAllRecipients);
router.get('/:id', recipientController.getRecipientById);
router.post('/', authenticateToken, requireRole('RECIPIENT', 'ADMIN'), recipientController.createRecipient);
router.put('/:id/profile', authenticateToken, validateRecipientProfile, recipientController.updateRecipientProfile);

module.exports = router;
