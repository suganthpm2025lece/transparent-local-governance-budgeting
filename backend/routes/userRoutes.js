const express = require('express');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/notifications', protect, userController.getMyNotifications);
router.patch('/notifications/:id/read', protect, userController.markNotificationRead);

router.get('/', protect, authorize('admin'), userController.listUsers);
router.patch('/:id/status', protect, authorize('admin'), userController.updateUserStatus);

module.exports = router;
