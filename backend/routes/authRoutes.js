const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth'); // ✅ Import middleware

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
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', authMiddleware, getCurrentUser);        
router.post('/logout', authMiddleware, logout);           
router.put('/change-password', authMiddleware, changePassword); 
router.post('/become-freelancer', authMiddleware, becomeFreelancer); 

module.exports = router;