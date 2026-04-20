const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllers');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Protected routes (require token)
router.get('/me', authController.verifyToken, authController.getCurrentUser);
router.get('/verify', authController.verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token valid',
    user: req.user
  });
});

module.exports = router;
