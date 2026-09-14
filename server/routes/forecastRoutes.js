const express = require('express');
const router = express.Router();
const { generateSalesForecast, getForecastHistory, getAvailableModels } = require('../controllers/forecastController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, generateSalesForecast);
router.get('/history', protect, getForecastHistory);
router.get('/models', protect, getAvailableModels);

module.exports = router;
