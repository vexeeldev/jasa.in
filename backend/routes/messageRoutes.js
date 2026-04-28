const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/auth');

// Semua route messages memerlukan authentication
router.use(authMiddleware);

// Get chat list
router.get('/chats', messageController.getChatList);

// Get messages by order
router.get('/order/:orderId', messageController.getMessagesByOrder);

// Send message
router.post('/order/:orderId', messageController.sendMessage);

// Mark single message as read
router.put('/:messageId/read', messageController.markAsRead);

// Mark all messages as read in order
router.put('/order/:orderId/read-all', messageController.markAllAsRead);

// Get unread count
router.get('/unread/count', messageController.getUnreadCount);

// Delete message
router.delete('/:messageId', messageController.deleteMessage);

// Get chat partner info
router.get('/partner/:orderId/:partnerId', messageController.getChatPartner);

// Typing indicator
router.post('/typing', messageController.sendTypingIndicator);

module.exports = router;