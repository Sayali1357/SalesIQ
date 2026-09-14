const express = require('express');
const router = express.Router();
const {
  getOverview,
  getRevenueTrend,
  getCategoryPerformance,
  getRegionPerformance,
  getChannelBreakdown,
  getTopProducts
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/overview', protect, getOverview);
router.get('/revenue-trend', protect, getRevenueTrend);
router.get('/categories', protect, getCategoryPerformance);
router.get('/regions', protect, getRegionPerformance);
router.get('/channels', protect, getChannelBreakdown);
router.get('/top-products', protect, getTopProducts);

module.exports = router;
