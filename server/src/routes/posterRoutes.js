const express = require('express');
const router = express.Router();
const { savePoster, getPosterHistory, logActivity } = require('../controllers/posterController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/save', savePoster);
router.get('/history', getPosterHistory);
router.post('/activity', logActivity);

module.exports = router;
