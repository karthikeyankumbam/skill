const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Professional = require('../models/Professional');
const Wallet = require('../models/Wallet');
const { protect, checkCredits } = require('../middleware/auth');

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', protect, checkCredits(1), [
  body('professional').notEmpty().withMessage('Professional ID is required'),
  body('service').notEmpty().withMessage('Service ID is required'),
  body('category').notEmpty().withMessage('Category ID is required'),
  body('serviceDate').notEmpty().withMessage('Service date is required'),
  body('serviceTime').notEmpty().withMessage('Service time is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const professional = await Professional.findById(req.body.professional);
    if (!professional || !professional.isActive) {
      return res.status(404).json({ success: false, message: 'Professional not found or inactive' });
    }

    // Calculate pricing
    const basePrice = professional.pricing.basePrice || 0;
    const additionalCharges = req.body.additionalCharges || 0;
    const discount = req.body.discount || 0;
    const totalAmount = basePrice + additionalCharges - discount;

    // Deduct credit for booking
    await req.wallet.deductCredits(1, `Booking created`, null);

    const booking = await Booking.create({
      user: req.user._id,
      professional: req.body.professional,
      service: req.body.service,
      category: req.body.category,
      serviceDate: req.body.serviceDate,
      serviceTime: req.body.serviceTime,
      address: req.body.address,
      description: req.body.description,
      pricing: {
        basePrice,
        additionalCharges,
        discount,
        totalAmount,
        creditsUsed: 1
      },
      status: 'pending'
    });

    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`professional_${professional.userId}`).emit('new-booking', {
        bookingId: booking._id,
        message: 'New booking request received'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating booking' });
  }
});

// @route   PUT /api/bookings/:id/accept
// @desc    Accept a booking (Professional)
// @access  Private
router.put('/:id/accept', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('professional');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if user is the professional
    const professional = await Professional.findOne({ userId: req.user._id });
    if (booking.professional._id.toString() !== professional._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Booking cannot be accepted' });
    }

    booking.status = 'accepted';
    booking.acceptedAt = new Date();
    await booking.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${booking.user}`).emit('booking-updated', {
        bookingId: booking._id,
        status: 'accepted',
        message: 'Your booking has been accepted'
      });
    }

    res.json({
      success: true,
      message: 'Booking accepted',
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error accepting booking' });
  }
});

// @route   PUT /api/bookings/:id/reject
// @desc    Reject a booking (Professional)
// @access  Private
router.put('/:id/reject', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('professional');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    if (booking.professional._id.toString() !== professional._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Booking cannot be rejected' });
    }

    booking.status = 'rejected';
    await booking.save();

    // Refund credit to user
    const userWallet = await Wallet.findOne({ userId: booking.user });
    if (userWallet && booking.pricing.creditsUsed > 0) {
      await userWallet.addCredits(
        booking.pricing.creditsUsed * (process.env.CREDIT_VALUE_IN_RUPEES || 10),
        'Refund for rejected booking',
        booking._id
      );
    }

    res.json({
      success: true,
      message: 'Booking rejected',
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error rejecting booking' });
  }
});

// @route   PUT /api/bookings/:id/update-status
// @desc    Update booking status
// @access  Private
router.put('/:id/update-status', protect, [
  body('status').isIn(['on_the_way', 'in_progress', 'completed']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('professional')
      .populate('user');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    const isProfessional = professional && booking.professional._id.toString() === professional._id.toString();
    const isUser = booking.user._id.toString() === req.user._id.toString();

    if (!isProfessional && !isUser) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { status } = req.body;
    const validTransitions = {
      'accepted': ['on_the_way', 'cancelled'],
      'on_the_way': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': []
    };

    if (!validTransitions[booking.status]?.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot transition from ${booking.status} to ${status}` 
      });
    }

    booking.status = status;
    if (status === 'completed') {
      booking.completedAt = new Date();
    }
    await booking.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      const targetUserId = isProfessional ? booking.user._id : professional.userId;
      io.to(`user_${targetUserId}`).emit('booking-updated', {
        bookingId: booking._id,
        status,
        message: `Booking status updated to ${status}`
      });
    }

    res.json({
      success: true,
      message: 'Booking status updated',
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error updating booking status' });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.put('/:id/cancel', protect, [
  body('reason').notEmpty().withMessage('Cancellation reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const booking = await Booking.findById(req.params.id)
      .populate('professional')
      .populate('user');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const professional = await Professional.findOne({ userId: req.user._id });
    const isProfessional = professional && booking.professional._id.toString() === professional._id.toString();
    const isUser = booking.user._id.toString() === req.user._id.toString();

    if (!isProfessional && !isUser) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Booking cannot be cancelled' });
    }

    // Calculate cancellation fee (configurable)
    const cancellationFee = booking.status === 'in_progress' ? booking.pricing.totalAmount * 0.2 : 0;
    const refundAmount = booking.pricing.totalAmount - cancellationFee;

    booking.status = 'cancelled';
    booking.cancellation = {
      cancelledBy: isProfessional ? 'professional' : 'user',
      cancelledAt: new Date(),
      reason: req.body.reason,
      refundAmount,
      cancellationFee
    };
    await booking.save();

    // Refund to user wallet
    if (refundAmount > 0) {
      const userWallet = await Wallet.findOne({ userId: booking.user._id });
      if (userWallet) {
        await userWallet.addCredits(
          refundAmount,
          'Refund for cancelled booking',
          booking._id
        );
      }
    }

    res.json({
      success: true,
      message: 'Booking cancelled',
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error cancelling booking' });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name profileImage phone')
      .populate('professional', 'profession rating')
      .populate('service', 'name')
      .populate('category', 'name');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check authorization
    const professional = await Professional.findOne({ userId: req.user._id });
    const isProfessional = professional && booking.professional._id.toString() === professional._id.toString();
    const isUser = booking.user._id.toString() === req.user._id.toString();

    if (!isProfessional && !isUser && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching booking' });
  }
});

module.exports = router;

