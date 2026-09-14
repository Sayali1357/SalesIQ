const express = require('express');
const router = express.Router();
const { getRecommendationsByProduct, getRecommendationsByCustomer } = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/product/:id?', protect, getRecommendationsByProduct);
router.get('/customer/:id', protect, getRecommendationsByCustomer);

module.exports = router;
