const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/auth');
const { isClient, isFreelancer } = require('../middleware/roleMiddleware');
const multer = require('multer');
const path = require('path');

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

// Deliver work (freelancer only)
router.post('/:id/deliver',  isFreelancer, orderController.deliverWork);

// Setup storage (pindahkan dari controller ke route atau tetap di controller)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Route untuk upload file
router.post('/upload-file', authMiddleware, upload.single('file'), orderController.uploadFile);

module.exports = router;