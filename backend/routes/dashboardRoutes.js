const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');
const { isClient, isFreelancer } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

// Client dashboard
router.get('/client', isClient, dashboardController.getClientDashboard);

// Freelancer dashboard
router.get('/freelancer', isFreelancer, dashboardController.getFreelancerDashboard);

module.exports = router;