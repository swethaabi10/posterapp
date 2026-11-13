const User = require('../models/User');
const UserActivity = require('../models/UserActivity');
const Template = require('../models/Template');

// @desc    Get dashboard statistics for admin
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res, next) => {
  try {
    // 1. Total Counts
    const totalUsers = await User.countDocuments();
    
    const totalSaves = await UserActivity.countDocuments({ action: 'save' });
    const totalShares = await UserActivity.countDocuments({ action: 'share' });
    
    const uniqueActiveUsers = await UserActivity.distinct('user');
    const totalActiveUsers = uniqueActiveUsers.length;

    // 2. Template category usage stats
    const categoryStats = await UserActivity.aggregate([
      {
        $lookup: {
          from: 'templates',
          localField: 'templateId',
          foreignField: '_id',
          as: 'template',
        },
      },
      { $unwind: '$template' },
      {
        $group: {
          _id: '$template.category',
          count: { $sum: 1 },
        },
      },
    ]);

    // 3. Daily activity stats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyStats = await UserActivity.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            action: '$action',
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalSaves,
        totalShares,
        totalActiveUsers,
        categoryStats,
        dailyStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with their activity counts
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
  try {
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'useractivities',
          localField: '_id',
          foreignField: 'user',
          as: 'activities',
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          shopName: 1,
          shopPhone: 1,
          whatsappNumber: 1,
          role: 1,
          createdAt: 1,
          savesCount: {
            $size: {
              $filter: {
                input: '$activities',
                as: 'act',
                cond: { $eq: ['$$act.action', 'save'] },
              },
            },
          },
          sharesCount: {
            $size: {
              $filter: {
                input: '$activities',
                as: 'act',
                cond: { $eq: ['$$act.action', 'share'] },
              },
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (promote/demote)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid role: user or admin',
      });
    }

    // Prevent admin from demoting themselves
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own admin status.',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users with their payment details
// @route   GET /api/admin/payments
// @access  Private/Admin
const getPayments = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('name email shopName shopPhone whatsappNumber paymentStatus paymentTxnId paymentDate createdAt')
      .sort({ paymentDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve user payment
// @route   POST /api/admin/payments/:userId/approve
// @access  Private/Admin
const approvePayment = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.paymentStatus = 'approved';
    
    // Set paymentDate. If today is the last day of the month, or they already have an active subscription in the current/future months,
    // set it to the 1st of the next month so the subscription is active for the upcoming calendar month.
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    const hasCurrentOrFuturePayment = user.paymentDate && (
      new Date(user.paymentDate).getFullYear() > currentYear ||
      (new Date(user.paymentDate).getFullYear() === currentYear && new Date(user.paymentDate).getMonth() >= currentMonth)
    );
    
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    if (now.getDate() === lastDay || hasCurrentOrFuturePayment) {
      user.paymentDate = new Date(currentYear, currentMonth + 1, 1);
    } else {
      user.paymentDate = now;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `Payment approved for ${user.name}.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        paymentStatus: user.paymentStatus,
        paymentDate: user.paymentDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject user payment
// @route   POST /api/admin/payments/:userId/reject
// @access  Private/Admin
const rejectPayment = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.paymentStatus = 'none';
    user.paymentTxnId = ''; // Clear failed transaction ID
    await user.save();

    res.status(200).json({
      success: true,
      message: `Payment verification rejected for ${user.name}. Status reset to none.`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        paymentStatus: user.paymentStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getUsers,
  updateUserRole,
  getPayments,
  approvePayment,
  rejectPayment,
};
