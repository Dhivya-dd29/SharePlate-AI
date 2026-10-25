const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { validateFoodListing } = require('../middleware/validator');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Public read endpoints for listings
router.get('/', donationController.getAllListings);
router.get('/:id', donationController.getListingById);

// Protected endpoints for donors and admins
router.post('/', authenticateToken, requireRole('DONOR', 'ADMIN'), validateFoodListing, donationController.createListing);
router.patch('/:id/status', authenticateToken, donationController.updateListingStatus);
router.delete('/:id', authenticateToken, donationController.deleteListing);

module.exports = router;
