const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const authMiddleware = require('../middleware/auth');
const { isFreelancer } = require('../middleware/roleMiddleware');

// Semua route skill memerlukan auth
router.use(authMiddleware);
router.use(isFreelancer);

// Get my skills
router.get('/my/skills', skillController.getMySkills);

// Add skill
router.post('/my/add', skillController.addSkill);

// Remove skill
router.delete('/my/remove/:skillId', skillController.removeSkill);

module.exports = router;