const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const authMiddleware = require('../middleware/auth');
const { isFreelancer } = require('../middleware/roleMiddleware');

// ================= PUBLIC ROUTES =================
// Get all services (with filters: category, search, min_price, max_price, sort, page, limit)
router.get('/', serviceController.getServices);

// Get service by ID
router.get('/:id', serviceController.getServiceById);

// ================= PROTECTED ROUTES (need login) =================
router.use(authMiddleware);

// Create new service (freelancer only)
router.post('/', isFreelancer, serviceController.createService);

// Update service (freelancer only)
router.put('/:id', isFreelancer, serviceController.updateService);

// Update service packages (freelancer only)
router.put('/:id/packages', isFreelancer, serviceController.updatePackages);

// Delete service (freelancer only)
router.delete('/:id', isFreelancer, serviceController.deleteService);

module.exports = router;