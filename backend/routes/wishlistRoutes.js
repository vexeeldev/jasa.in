const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const authMiddleware = require('../middleware/auth');
const { isClient } = require('../middleware/roleMiddleware');

// Semua route wishlist memerlukan authentication dan role client
router.use(authMiddleware);
router.use(isClient);

// Get my wishlist
router.get('/', wishlistController.getMyWishlist);

// Get wishlist count
router.get('/count', wishlistController.getWishlistCount);

// Check if service in wishlist
router.get('/check/:serviceId', wishlistController.isInWishlist);

// Add to wishlist
router.post('/', wishlistController.addToWishlist);

// Bulk add to wishlist
router.post('/bulk', wishlistController.bulkAddToWishlist);

// Remove from wishlist by wishlist ID
router.delete('/:wishlistId', wishlistController.removeFromWishlist);

// Remove from wishlist by service ID
router.delete('/service/:serviceId', wishlistController.removeServiceFromWishlist);

// Clear all wishlist
router.delete('/', wishlistController.clearWishlist);

module.exports = router;