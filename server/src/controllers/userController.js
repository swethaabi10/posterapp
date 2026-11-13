const User = require('../models/User');

// @desc    Get logged-in user's profile
// @route   GET /api/user/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ownerName: user.ownerName,
        shopName: user.shopName,
        shopAddress: user.shopAddress,
        shopPhone: user.shopPhone,
        whatsappNumber: user.whatsappNumber,
        logoUrl: user.logoUrl,
        paymentStatus: user.paymentStatus,
        paymentTxnId: user.paymentTxnId,
        paymentDate: user.paymentDate,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update logged-in user's profile
// @route   PUT /api/user/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const {
      name,
      ownerName,
      shopName,
      shopAddress,
      shopPhone,
      whatsappNumber,
      logoUrl,
    } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (ownerName !== undefined) updateFields.ownerName = ownerName;
    if (shopName !== undefined) updateFields.shopName = shopName;
    if (shopAddress !== undefined) updateFields.shopAddress = shopAddress;
    if (shopPhone !== undefined) updateFields.shopPhone = shopPhone;
    if (whatsappNumber !== undefined) updateFields.whatsappNumber = whatsappNumber;
    if (logoUrl !== undefined) updateFields.logoUrl = logoUrl;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ownerName: user.ownerName,
        shopName: user.shopName,
        shopAddress: user.shopAddress,
        shopPhone: user.shopPhone,
        whatsappNumber: user.whatsappNumber,
        logoUrl: user.logoUrl,
        paymentStatus: user.paymentStatus,
        paymentTxnId: user.paymentTxnId,
        paymentDate: user.paymentDate,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit payment reference details for verification
// @route   POST /api/user/submit-payment
// @access  Private
const submitPayment = async (req, res, next) => {
  try {
    const { txnId } = req.body;

    if (!txnId || txnId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid transaction reference ID.',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.paymentStatus = 'pending';
    user.paymentTxnId = txnId.trim();
    // Do not modify user.paymentDate on submission to keep the old payment date
    // for renewal validation in the admin approval step.
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Payment reference submitted successfully. Status is now pending verification.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ownerName: user.ownerName,
        shopName: user.shopName,
        shopAddress: user.shopAddress,
        shopPhone: user.shopPhone,
        whatsappNumber: user.whatsappNumber,
        logoUrl: user.logoUrl,
        paymentStatus: user.paymentStatus,
        paymentTxnId: user.paymentTxnId,
        paymentDate: user.paymentDate,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, submitPayment };
