const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Wallet = require('../models/Wallet');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');

// @route   POST /api/referrals/apply
// @desc    Apply referral code
// @access  Private
router.post('/apply', protect, [
  body('referralCode').notEmpty().withMessage('Referral code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { referralCode } = req.body;

    // Find referrer
    const referrer = await User.findOne({ referralCode });
    if (!referrer) {
      return res.status(404).json({ success: false, message: 'Invalid referral code' });
    }

    if (referrer._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot use your own referral code' });
    }

    // Check if already referred
    const existingReferral = await Referral.findOne({
      referred: req.user._id
    });

    if (existingReferral) {
      return res.status(400).json({ success: false, message: 'Referral code already used' });
    }

    // Create referral record
    await Referral.create({
      referrer: referrer._id,
      referred: req.user._id,
      referralCode,
      type: 'user',
      status: 'pending'
    });

    // Update user
    await User.findByIdAndUpdate(req.user._id, { referredBy: referrer._id });

    res.json({
      success: true,
      message: 'Referral code applied successfully. You will receive credits after your first booking.'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error applying referral code' });
  }
});

// @route   GET /api/referrals/my-referrals
// @desc    Get user's referrals
// @access  Private
router.get('/my-referrals', protect, async (req, res) => {
  try {
    const referrals = await Referral.find({ referrer: req.user._id })
      .populate('referred', 'name phone createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      referrals
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching referrals' });
  }
});

// Helper function to process referral rewards (called after booking completion)
async function processReferralRewards(userId, bookingId) {
  try {
    const referral = await Referral.findOne({ 
      referred: userId,
      status: 'pending'
    });

    if (!referral) return;

    // Check if user has completed first booking
    const booking = await Booking.findOne({ 
      user: userId,
      status: 'completed'
    });

    if (!booking) return;

    // Award credits to both referrer and referred
    const referrerWallet = await Wallet.findOne({ userId: referral.referrer });
    const referredWallet = await Wallet.findOne({ userId: referral.referred });

    const creditValue = process.env.CREDIT_VALUE_IN_RUPEES || 10;
    const rewardAmount = creditValue; // 1 credit worth

    if (referrerWallet) {
      await referrerWallet.addCredits(rewardAmount, 'Referral reward', bookingId);
    }

    if (referredWallet) {
      await referredWallet.addCredits(rewardAmount, 'Referral reward', bookingId);
    }

    // Update referral status
    referral.status = 'completed';
    referral.completedAt = new Date();
    referral.reward = {
      credits: 1,
      amount: rewardAmount
    };
    await referral.save();
  } catch (error) {
    console.error('Error processing referral rewards:', error);
  }
}

module.exports = router;
module.exports.processReferralRewards = processReferralRewards;

