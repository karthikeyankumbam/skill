const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Wallet = require('../models/Wallet');
const { protect } = require('../middleware/auth');
const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'test_key',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'test_secret'
});

// @route   GET /api/wallet
// @desc    Get wallet balance and transactions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ userId: req.user._id });

    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user._id,
        balance: 0,
        credits: 0
      });
    }

    const { page = 1, limit = 20 } = req.query;
    const transactions = wallet.transactions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      wallet: {
        balance: wallet.balance,
        credits: wallet.credits,
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: wallet.transactions.length,
          pages: Math.ceil(wallet.transactions.length / limit)
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching wallet' });
  }
});

// @route   POST /api/wallet/add-funds
// @desc    Create payment order for adding funds
// @access  Private
router.post('/add-funds', protect, [
  body('amount').isNumeric().withMessage('Amount is required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least ₹1')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { amount } = req.body;

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `wallet_${req.user._id}_${Date.now()}`,
      notes: {
        userId: req.user._id.toString(),
        type: 'wallet_recharge'
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating payment order' });
  }
});

// @route   POST /api/wallet/verify-payment
// @desc    Verify payment and add funds to wallet
// @access  Private
router.post('/verify-payment', protect, [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('paymentId').notEmpty().withMessage('Payment ID is required'),
  body('signature').notEmpty().withMessage('Signature is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { orderId, paymentId, signature, amount } = req.body;

    // Verify payment signature (in production, use proper verification)
    // const crypto = require('crypto');
    // const expectedSignature = crypto
    //   .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    //   .update(orderId + '|' + paymentId)
    //   .digest('hex');
    // if (expectedSignature !== signature) {
    //   return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    // }

    let wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({
        userId: req.user._id,
        balance: 0,
        credits: 0
      });
    }

    // Add funds to wallet
    await wallet.addCredits(amount, 'Wallet recharge', paymentId);

    res.json({
      success: true,
      message: 'Funds added successfully',
      wallet: {
        balance: wallet.balance,
        credits: wallet.credits
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error verifying payment' });
  }
});

// @route   POST /api/wallet/withdraw
// @desc    Request withdrawal (for professionals)
// @access  Private
router.post('/withdraw', protect, [
  body('amount').isNumeric().withMessage('Amount is required'),
  body('accountNumber').notEmpty().withMessage('Account number is required'),
  body('ifscCode').notEmpty().withMessage('IFSC code is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { amount, accountNumber, ifscCode } = req.body;

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Insufficient balance' 
      });
    }

    // Create withdrawal transaction
    wallet.transactions.push({
      type: 'withdrawal',
      amount: -amount,
      description: `Withdrawal to account ending in ${accountNumber.slice(-4)}`,
      status: 'pending'
    });

    wallet.balance -= amount;
    await wallet.save();

    // In production, integrate with payment gateway for actual transfer
    res.json({
      success: true,
      message: 'Withdrawal request submitted',
      wallet: {
        balance: wallet.balance,
        credits: wallet.credits
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error processing withdrawal' });
  }
});

module.exports = router;

