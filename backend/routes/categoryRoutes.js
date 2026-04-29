const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleMiddleware');

// ================= PUBLIC ROUTES =================
// Get all categories
router.get('/', categoryController.getAllCategories);

// Get category tree (hierarchy)
router.get('/tree', categoryController.getCategoryTree);

// Get popular categories
router.get('/popular', categoryController.getPopularCategories);

// Get category by ID
router.get('/:id', categoryController.getCategoryById);

// Get category by slug
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// Get category breadcrumb
router.get('/:id/breadcrumb', categoryController.getCategoryBreadcrumb);

// ================= ADMIN ONLY ROUTES =================
router.use(authMiddleware);
router.use(isAdmin);

// Create category
router.post('/', categoryController.createCategory);

// Update category
router.put('/:id', categoryController.updateCategory);

// Delete category
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;