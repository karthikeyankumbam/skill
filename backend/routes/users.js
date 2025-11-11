const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { protect, checkCredits } = require('../middleware/auth');
const upload = require('../utils/upload');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const wallet = await Wallet.findOne({ userId: user._id });

    res.json({
      success: true,
      user,
      wallet: wallet ? {
        balance: wallet.balance,
        credits: wallet.credits
      } : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching profile' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, upload.single('profileImage'), async (req, res) => {
  try {
    const { name, email, address, language } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (language) updateData.language = language;
    if (address) {
      try {
        updateData.address = JSON.parse(address);
      } catch (e) {
        updateData.address = address;
      }
    }
    if (req.file) {
      updateData.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error updating profile' });
  }
});

// @route   GET /api/users/bookings
// @desc    Get user bookings
// @access  Private
router.get('/bookings', protect, async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('professional', 'profession rating')
      .populate('service', 'name')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching bookings' });
  }
});

module.exports = router;

