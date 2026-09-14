const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser, getDatabaseStatistics } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/users', authorize('Admin'), getUsers);
router.post('/users', authorize('Admin'), createUser);
router.put('/users/:id', authorize('Admin'), updateUser);
router.delete('/users/:id', authorize('Admin'), deleteUser);
router.get('/admin/statistics', authorize('Admin'), getDatabaseStatistics);

module.exports = router;
