const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');

// Semua route notifikasi memerlukan authentication
router.use(authMiddleware);

// Get all notifications
router.get('/', notificationController.getNotifications);

// Get unread count
router.get('/unread/count', notificationController.getUnreadCount);

// Get notification by ID
router.get('/:notifId', notificationController.getNotificationById);

// Mark notification as read
router.put('/:notifId/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read/all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:notifId', notificationController.deleteNotification);

// Delete all notifications
router.delete('/', notificationController.deleteAllNotifications);

module.exports = router;