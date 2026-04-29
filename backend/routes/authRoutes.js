const express = require('express');
const router = express.Router();

const {
  login,
  register,
  getCurrentUser,
  logout,
  changePassword,
  becomeFreelancer,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

router.post('/login', login);
router.post('/register', register);
router.get('/me', getCurrentUser);
router.post('/logout', logout);
router.put('/change-password', changePassword);
router.post('/become-freelancer', becomeFreelancer);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;