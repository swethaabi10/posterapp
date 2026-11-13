const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, submitPayment } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/profile')
  .get(getProfile)
  .put(updateProfile);

router.post('/submit-payment', submitPayment);

module.exports = router;
