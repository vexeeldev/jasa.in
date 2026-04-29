const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const authMiddleware = require('../middleware/auth');
const { isFreelancer, isAdmin } = require('../middleware/roleMiddleware');
const upload = require('../middleware/upload');

// ================= PUBLIC ROUTES =================
// Get recent portfolios (for homepage)
router.get('/recent', portfolioController.getRecentPortfolios);

// Get portfolios by freelancer
router.get('/freelancer/:freelancerId', portfolioController.getPortfoliosByFreelancer);

// Get portfolio by ID
router.get('/:id', portfolioController.getPortfolioById);

// ================= PROTECTED ROUTES =================
router.use(authMiddleware);

// Get my portfolios (freelancer login)
router.get('/my/portfolios', isFreelancer, portfolioController.getMyPortfolios);

// Create portfolio (freelancer only)
router.post('/', isFreelancer, portfolioController.createPortfolio);

// Upload portfolio image
router.post('/upload', isFreelancer, upload.single('image'), portfolioController.uploadPortfolioImage);

// Update portfolio
router.put('/:id', isFreelancer, portfolioController.updatePortfolio);

// Delete portfolio
router.delete('/:id', isFreelancer, portfolioController.deletePortfolio);

// Admin can delete any portfolio
router.delete('/admin/:id', isAdmin, portfolioController.deletePortfolio);

module.exports = router;