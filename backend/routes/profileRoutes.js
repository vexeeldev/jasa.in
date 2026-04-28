const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { verifyToken } = require('../controllers/authController'); 

router.get('/me', verifyToken, profileController.getMyFullProfile);
router.put('/update', verifyToken, profileController.updateProfile);

module.exports = router;