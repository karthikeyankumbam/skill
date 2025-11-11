const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const { protect } = require('../middleware/auth');
const upload = require('../utils/upload');

// @route   POST /api/reviews
// @desc    Create a review
// @access  Private
router.post('/', protect, upload.array('photos', 3), [
  body('booking').notEmpty().withMessage('Booking ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const booking = await Booking.findById(req.body.booking)
      .populate('professional');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: 'Can only review completed bookings' 
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ booking: booking._id });
    if (existingReview) {
      return res.status(400).json({ 
        success: false, 
        message: 'Review already exists for this booking' 
      });
    }

    const photos = req.files ? req.files.map(file => `/uploads/reviews/${file.filename}`) : [];

    const review = await Review.create({
      booking: booking._id,
      user: req.user._id,
      professional: booking.professional._id,
      rating: req.body.rating,
      comment: req.body.comment,
      photos,
      isVerified: true
    });

    // Update booking with review reference
    booking.review = review._id;
    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating review' });
  }
});

// @route   GET /api/reviews/professional/:id
// @desc    Get reviews for a professional
// @access  Public
router.get('/professional/:id', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ 
      professional: req.params.id,
      isVisible: true 
    })
      .populate('user', 'name profileImage')
      .populate('booking', 'serviceDate')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ 
      professional: req.params.id,
      isVisible: true 
    });

    res.json({
      success: true,
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching reviews' });
  }
});

module.exports = router;

