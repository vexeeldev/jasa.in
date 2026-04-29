const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleMiddleware');
const upload = require('../middleware/upload');

// ================= PUBLIC ROUTES =================
// Get user profile by ID (public)
router.get('/profile/:id', userController.getProfile);

// ================= PROTECTED ROUTES =================
router.use(authMiddleware);

// Get my own profile (from token)
router.get('/me', userController.getProfile);

// Update my profile
router.put('/profile', userController.updateProfile);

// Update avatar (upload file)
router.post('/avatar', upload.single('avatar'), userController.updateAvatar);

// Update settings (password, notification preferences)
router.put('/settings', userController.updateSettings);

// Get my stats
router.get('/stats', userController.getUserStats);

// ================= ADMIN ONLY ROUTES =================
// Get all users (with pagination & filter)
router.get('/all', isAdmin, userController.getAllUsers);

// Get user by ID (admin)
router.get('/admin/:id', isAdmin, userController.getProfile);

// Delete user (admin only)
router.delete('/admin/:id', isAdmin, userController.deleteUser);

module.exports = router;