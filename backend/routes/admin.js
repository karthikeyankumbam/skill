const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Professional = require('../models/Professional');
const Booking = require('../models/Booking');
const Wallet = require('../models/Wallet');
const Category = require('../models/Category');
const Service = require('../models/Service');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require admin role
router.use(protect);
router.use(authorize('admin'));

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private (Admin only)
router.get('/dashboard', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const stats = {
      users: {
        total: await User.countDocuments({ role: 'user', ...dateFilter }),
        active: await User.countDocuments({ role: 'user', isActive: true, ...dateFilter })
      },
      professionals: {
        total: await Professional.countDocuments(dateFilter),
        active: await Professional.countDocuments({ isActive: true, ...dateFilter }),
        pending: await Professional.countDocuments({ 'kyc.status': 'pending', ...dateFilter }),
        verified: await Professional.countDocuments({ isVerified: true, ...dateFilter })
      },
      bookings: {
        total: await Booking.countDocuments(dateFilter),
        pending: await Booking.countDocuments({ status: 'pending', ...dateFilter }),
        completed: await Booking.countDocuments({ status: 'completed', ...dateFilter }),
        cancelled: await Booking.countDocuments({ status: 'cancelled', ...dateFilter })
      },
      revenue: {
        total: 0,
        thisMonth: 0,
        walletTopUps: 0
      }
    };

    // Calculate revenue from completed bookings
    const completedBookings = await Booking.find({ 
      status: 'completed',
      ...dateFilter 
    });
    stats.revenue.total = completedBookings.reduce((sum, b) => sum + (b.pricing.totalAmount || 0), 0);

    // This month revenue
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    const thisMonthBookings = await Booking.find({
      status: 'completed',
      createdAt: { $gte: thisMonthStart }
    });
    stats.revenue.thisMonth = thisMonthBookings.reduce((sum, b) => sum + (b.pricing.totalAmount || 0), 0);

    // Wallet top-ups
    const wallets = await Wallet.find();
    wallets.forEach(wallet => {
      wallet.transactions.forEach(txn => {
        if (txn.type === 'credit' && txn.status === 'completed') {
          if (!dateFilter.createdAt || 
              (txn.createdAt >= dateFilter.createdAt.$gte && txn.createdAt <= dateFilter.createdAt.$lte)) {
            stats.revenue.walletTopUps += txn.amount;
          }
        }
      });
    });

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard stats' });
  }
});

// @route   GET /api/admin/professionals/pending-kyc
// @desc    Get professionals pending KYC approval
// @access  Private (Admin only)
router.get('/professionals/pending-kyc', async (req, res) => {
  try {
    const professionals = await Professional.find({ 'kyc.status': 'pending' })
      .populate('userId', 'name phone email')
      .populate('category', 'name')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      professionals
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching pending KYC' });
  }
});

// @route   PUT /api/admin/professionals/:id/approve-kyc
// @desc    Approve professional KYC
// @access  Private (Admin only)
router.put('/professionals/:id/approve-kyc', async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id);

    if (!professional) {
      return res.status(404).json({ success: false, message: 'Professional not found' });
    }

    professional.kyc.status = 'approved';
    professional.kyc.verifiedAt = new Date();
    professional.kyc.verifiedBy = req.user._id;
    professional.isActive = true;
    professional.isVerified = true;
    await professional.save();

    res.json({
      success: true,
      message: 'KYC approved successfully',
      professional
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error approving KYC' });
  }
});

// @route   PUT /api/admin/professionals/:id/reject-kyc
// @desc    Reject professional KYC
// @access  Private (Admin only)
router.put('/professionals/:id/reject-kyc', [
  body('reason').notEmpty().withMessage('Rejection reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const professional = await Professional.findById(req.params.id);

    if (!professional) {
      return res.status(404).json({ success: false, message: 'Professional not found' });
    }

    professional.kyc.status = 'rejected';
    professional.kyc.verifiedAt = new Date();
    professional.kyc.verifiedBy = req.user._id;
    professional.isActive = false;
    await professional.save();

    res.json({
      success: true,
      message: 'KYC rejected',
      professional
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error rejecting KYC' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// @route   GET /api/admin/professionals
// @desc    Get all professionals
// @access  Private (Admin only)
router.get('/professionals', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};

    if (status === 'pending') query['kyc.status'] = 'pending';
    if (status === 'approved') query['kyc.status'] = 'approved';
    if (status === 'active') query.isActive = true;

    if (search) {
      query.$or = [
        { profession: new RegExp(search, 'i') },
        { bio: new RegExp(search, 'i') }
      ];
    }

    const professionals = await Professional.find(query)
      .populate('userId', 'name phone email')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Professional.countDocuments(query);

    res.json({
      success: true,
      professionals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching professionals' });
  }
});

// @route   GET /api/admin/bookings
// @desc    Get all bookings
// @access  Private (Admin only)
router.get('/bookings', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const query = {};

    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name phone')
      .populate('professional', 'profession')
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

// @route   POST /api/admin/categories
// @desc    Create a category
// @access  Private (Admin only)
router.post('/categories', [
  body('name').notEmpty().withMessage('Category name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      category
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating category' });
  }
});

// @route   PUT /api/admin/categories/:id
// @desc    Update a category
// @access  Private (Admin only)
router.put('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({
      success: true,
      category
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error updating category' });
  }
});

// @route   POST /api/admin/services
// @desc    Create a service
// @access  Private (Admin only)
router.post('/services', [
  body('name').notEmpty().withMessage('Service name is required'),
  body('category').notEmpty().withMessage('Category is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const service = await Service.create(req.body);

    res.status(201).json({
      success: true,
      service
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating service' });
  }
});

// @route   POST /api/admin/coupons
// @desc    Create a coupon
// @access  Private (Admin only)
router.post('/coupons', [
  body('code').notEmpty().withMessage('Coupon code is required'),
  body('type').isIn(['percentage', 'fixed']).withMessage('Invalid coupon type'),
  body('value').isNumeric().withMessage('Coupon value is required'),
  body('validFrom').notEmpty().withMessage('Valid from date is required'),
  body('validUntil').notEmpty().withMessage('Valid until date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const coupon = await Coupon.create({
      ...req.body,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      coupon
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating coupon' });
  }
});

// @route   GET /api/admin/analytics/revenue
// @desc    Get revenue analytics
// @access  Private (Admin only)
router.get('/analytics/revenue', async (req, res) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year

    // This is a simplified version - in production, use aggregation pipelines
    const completedBookings = await Booking.find({ status: 'completed' })
      .select('pricing.totalAmount createdAt');

    const revenueByPeriod = {};
    completedBookings.forEach(booking => {
      const date = new Date(booking.createdAt);
      let key;
      
      if (period === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (period === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (period === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = date.getFullYear().toString();
      }

      if (!revenueByPeriod[key]) {
        revenueByPeriod[key] = 0;
      }
      revenueByPeriod[key] += booking.pricing.totalAmount || 0;
    });

    res.json({
      success: true,
      revenue: revenueByPeriod
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching revenue analytics' });
  }
});

module.exports = router;

