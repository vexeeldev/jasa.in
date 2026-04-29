const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth');
const { isClient, isAdmin } = require('../middleware/roleMiddleware');

// ================= PUBLIC ROUTES =================
// Get reviews by service
router.get('/service/:serviceId', reviewController.getReviewsByService);

// Get reviews by freelancer
router.get('/freelancer/:freelancerId', reviewController.getReviewsByFreelancer);

// Get review statistics
router.get('/stats', reviewController.getReviewStats);

// ================= PROTECTED ROUTES =================
router.use(authMiddleware);

// Client only
router.post('/order/:orderId', isClient, reviewController.createReview);
router.get('/check/:orderId', isClient, reviewController.canReview);
router.get('/my', reviewController.getMyReviews);
router.put('/:reviewId', reviewController.updateReview);
router.delete('/:reviewId', reviewController.deleteReview);

module.exports = router;
