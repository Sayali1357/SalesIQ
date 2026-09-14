const express = require('express');
const router = express.Router();
const { getInventory, getLowStock, getOutOfStock, predictDemand } = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getInventory);
router.get('/low-stock', protect, getLowStock);
router.get('/out-of-stock', protect, getOutOfStock);
router.post('/predict-demand', protect, predictDemand);

module.exports = router;
