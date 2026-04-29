const express = require('express');
const router = express.Router();
const skillController = require('../controllers/skillController');
const authMiddleware = require('../middleware/auth');
const { isFreelancer, isAdmin } = require('../middleware/roleMiddleware');

// ================= PUBLIC ROUTES =================
// Get all skills
router.get('/', skillController.getAllSkills);

// Get skill categories
router.get('/categories', skillController.getSkillCategories);

// Get popular skills
router.get('/popular', skillController.getPopularSkills);

// Get skill by ID
router.get('/:id', skillController.getSkillById);

// Get skills by freelancer
router.get('/freelancer/:freelancerId', skillController.getSkillsByFreelancer);

// ================= PROTECTED ROUTES =================
router.use(authMiddleware);

// Get my skills (freelancer login)
router.get('/my/skills', isFreelancer, skillController.getMySkills);

// Add skill to freelancer
router.post('/my/add', isFreelancer, skillController.addSkillToFreelancer);

// Bulk add skills
router.post('/my/bulk-add', isFreelancer, skillController.bulkAddSkills);

// Remove skill from freelancer
router.delete('/my/remove/:skillId', isFreelancer, skillController.removeSkillFromFreelancer);

// ================= ADMIN ONLY ROUTES =================
// Create skill
router.post('/', isAdmin, skillController.createSkill);

// Update skill
router.put('/:id', isAdmin, skillController.updateSkill);

// Delete skill
router.delete('/:id', isAdmin, skillController.deleteSkill);

module.exports = router;