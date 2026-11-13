const PosterHistory = require('../models/PosterHistory');
const UserActivity = require('../models/UserActivity');

// @desc    Save a generated poster to history
// @route   POST /api/posters/save
// @access  Private
const savePoster = async (req, res, next) => {
  try {
    const {
      templateId,
      imageUrlOrData,
      goldRate22k,
      goldRate24k,
      goldRate18k,
      silverRate,
      date,
    } = req.body;

    if (!imageUrlOrData || !date || goldRate22k === undefined || goldRate24k === undefined || silverRate === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: imageUrlOrData, date, and rate information.',
      });
    }

    const poster = await PosterHistory.create({
      user: req.user._id,
      templateId: templateId || null,
      imageUrlOrData,
      goldRate22k: Number(goldRate22k),
      goldRate24k: Number(goldRate24k),
      goldRate18k: goldRate18k !== undefined ? Number(goldRate18k) : Math.round(Number(goldRate22k) * 18 / 22),
      silverRate: Number(silverRate),
      date,
    });

    // Log user save activity
    if (templateId) {
      await UserActivity.create({
        user: req.user._id,
        templateId,
        action: 'save',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Poster saved to history.',
      poster,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get poster history for logged-in user (latest 30 entries)
// @route   GET /api/posters/history
// @access  Private
const getPosterHistory = async (req, res, next) => {
  try {
    const posters = await PosterHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('templateId', 'name category layoutType');

    res.status(200).json({
      success: true,
      count: posters.length,
      posters,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log a poster activity (like share)
// @route   POST /api/posters/activity
// @access  Private
const logActivity = async (req, res, next) => {
  try {
    const { templateId, action } = req.body;

    if (!templateId || !action || !['save', 'share'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid templateId and action (save or share).',
      });
    }

    const activity = await UserActivity.create({
      user: req.user._id,
      templateId,
      action,
    });

    res.status(201).json({
      success: true,
      message: 'Activity logged successfully.',
      activity,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  savePoster,
  getPosterHistory,
  logActivity,
};
