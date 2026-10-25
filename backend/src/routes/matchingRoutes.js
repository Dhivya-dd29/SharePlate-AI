const express = require('express');
const router = express.Router();
const matchingController = require('../controllers/matchingController');

router.post('/recommend/:listing_id', matchingController.getRecommendations);
router.get('/evaluation', matchingController.getEvaluationMetrics);

module.exports = router;
