const express = require('express');
const router = express.Router();
const { getSegments, getCustomers, getCustomerById } = require('../controllers/customerController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getCustomers);
router.get('/segments', protect, getSegments);
router.post('/segment', protect, getSegments);
router.get('/:id', protect, getCustomerById);

module.exports = router;
