const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// =====================
// PUBLIC ROUTES
// =====================
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post(
  '/become-freelancer',
  authController.verifyToken,
  authController.becomeFreelancer
);

// =====================
// PROTECTED ROUTES
// =====================
router.post('/logout', authController.verifyToken, authController.logout);

router.get('/me', authController.verifyToken, authController.getCurrentUser);

// (Optional - debug)
router.get('/verify', authController.verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token valid',
    user: req.user
  });
});

module.exports = router;