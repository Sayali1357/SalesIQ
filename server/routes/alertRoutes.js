const express = require('express');
const router = express.Router();
const { getAlerts, generateAlerts, resolveAlert, deleteAlert } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getAlerts);
router.post('/generate', protect, generateAlerts);
router.patch('/:id/resolve', protect, resolveAlert);
router.delete('/:id', protect, deleteAlert);

module.exports = router;
