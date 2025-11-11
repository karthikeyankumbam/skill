const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { sendOTP, verifyOTP } = require('../utils/sendOTP');
const generateToken = require('../utils/generateToken');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/send-otp
// @desc    Send OTP to phone number
// @access  Public
router.post('/send-otp', [
  body('phone').notEmpty().withMessage('Phone number is required')
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Please provide a valid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: errors.array()[0].msg,
        errors: errors.array() 
      });
    }

    const { phone } = req.body;
    await sendOTP(phone);

    res.json({
      success: true,
      message: 'OTP sent successfully'
    });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error sending OTP' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login/register
// @access  Public
router.post('/verify-otp', [
  body('phone').notEmpty().withMessage('Phone number is required')
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Please provide a valid phone number'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('email').optional().isEmail().withMessage('Please provide a valid email address'),
  body('role').optional().isIn(['user', 'professional']).withMessage('Role must be either user or professional')
], async (req, res) => {
  // Note: Email and role validation for new users is handled in the route logic below
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: errors.array()[0].msg,
        errors: errors.array() 
      });
    }

    const { phone, otp, name, email, role } = req.body;

    const verification = verifyOTP(phone, otp);
    if (!verification.valid) {
      return res.status(400).json({ success: false, message: verification.message });
    }

    let user = await User.findOne({ phone });

    // Register new user if doesn't exist
    if (!user) {
      if (!name) {
        return res.status(400).json({ success: false, message: 'Name is required for new users' });
      }
      if (!email || !email.trim()) {
        return res.status(400).json({ success: false, message: 'Email is required for registration' });
      }
      if (!role || !['user', 'professional'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Role is required. Must be either "user" or "professional"' });
      }

      const userData = {
        name,
        phone,
        email: email.trim().toLowerCase(),
        role: role,
        authMethod: 'otp',
        isVerified: true
      };

      user = await User.create(userData);

      // Create wallet for new user
      await Wallet.create({
        userId: user._id,
        balance: 0,
        credits: 0
      });
    } else {
      // Update email if provided and not already set
      if (email && email.trim() && !user.email) {
        user.email = email.trim().toLowerCase();
      }
      // Update role if provided and user doesn't have a role set
      if (role && ['user', 'professional'].includes(role) && user.role === 'user') {
        user.role = role;
      }
      user.isVerified = true;
      await user.save();
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error verifying OTP' });
  }
});

// @route   POST /api/auth/google
// @desc    Google OAuth login
// @access  Public
router.post('/google', [
  body('googleId').notEmpty().withMessage('Google ID is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('name').notEmpty().withMessage('Name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { googleId, email, name, profileImage } = req.body;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      user = await User.create({
        name,
        email,
        googleId,
        authMethod: 'google',
        profileImage,
        isVerified: true
      });

      await Wallet.create({
        userId: user._id,
        balance: 0,
        credits: 0
      });
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error with Google authentication' });
  }
});

// @route   POST /api/auth/apple
// @desc    Apple OAuth login
// @access  Public
router.post('/apple', [
  body('appleId').notEmpty().withMessage('Apple ID is required'),
  body('email').optional().isEmail(),
  body('name').notEmpty().withMessage('Name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { appleId, email, name, profileImage } = req.body;

    let user = await User.findOne({ $or: [{ appleId }, { email }] });

    if (!user) {
      user = await User.create({
        name,
        email,
        appleId,
        authMethod: 'apple',
        profileImage,
        isVerified: true
      });

      await Wallet.create({
        userId: user._id,
        balance: 0,
        credits: 0
      });
    } else {
      if (!user.appleId) {
        user.appleId = appleId;
        await user.save();
      }
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error with Apple authentication' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const wallet = await Wallet.findOne({ userId: user._id });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        address: user.address,
        language: user.language,
        referralCode: user.referralCode
      },
      wallet: wallet ? {
        balance: wallet.balance,
        credits: wallet.credits
      } : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
});

module.exports = router;

