const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');
const { isClient, isFreelancer } = require('../middleware/roleMiddleware');

// Semua route order memerlukan authentication
router.use(authMiddleware);

// ================= ORDER CRUD =================
// Get all orders (with filters: status, page, limit)
router.get('/', orderController.getOrders);

// Get order by ID
router.get('/:id', orderController.getOrderById);

// Create order (checkout)
router.post('/', isClient, orderController.createOrder);

// Update order status
router.put('/:id/status', orderController.updateOrderStatus);

// Cancel order
router.put('/:id/cancel', orderController.cancelOrder);

// ================= ORDER TRACKING =================
// Get order tracking info
router.get('/:id/track', orderController.getOrderTracking);

// ================= FREELANCER ACTIONS =================
// Deliver work (freelancer only)
router.post('/:id/deliver', isFreelancer, orderController.deliverWork);

// ================= CLIENT ACTIONS =================
// Approve order (client only)
router.post('/:id/approve', isClient, orderController.approveOrder);

// Request revision (client only)
router.post('/:id/revision', isClient, orderController.requestRevision);

module.exports = router;