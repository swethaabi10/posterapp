const express = require('express');
const router = express.Router();
const { getStats, getUsers, updateUserRole, getPayments, approvePayment, rejectPayment } = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes with authentication and admin-only restriction
router.use(protect);
router.use(restrictTo('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);

router.get('/payments', getPayments);
router.post('/payments/:userId/approve', approvePayment);
router.post('/payments/:userId/reject', rejectPayment);

module.exports = router;
