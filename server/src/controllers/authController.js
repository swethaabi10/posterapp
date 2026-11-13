const User = require('../models/User');
const { generateToken } = require('../utils/jwt');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, shopName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered.',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      shopName: shopName || '',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopName: user.shopName,
        ownerName: user.ownerName,
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

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.',
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    await user.checkPaymentExpiration();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopName: user.shopName,
        ownerName: user.ownerName,
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

module.exports = { register, login };
