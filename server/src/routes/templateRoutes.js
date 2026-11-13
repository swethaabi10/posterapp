const express = require('express');
const router = express.Router();
const { getTodayTemplate, getAllTemplates, getTemplateById } = require('../controllers/templateController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/today', getTodayTemplate);
router.get('/', getAllTemplates);
router.get('/:id', getTemplateById);

module.exports = router;
