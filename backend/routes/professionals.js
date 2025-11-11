const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Professional = require('../models/Professional');
const Wallet = require('../models/Wallet');
const { protect, optionalAuth, checkCredits } = require('../middleware/auth');
const upload = require('../utils/upload');

// @route   GET /api/professionals
// @desc    Get all professionals (with access control)
// @access  Public (with optional auth)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, city, rating, search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true, 'kyc.status': 'approved' };

    if (category) query.category = category;
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (rating) query['rating.average'] = { $gte: parseFloat(rating) };

    if (search) {
      query.$or = [
        { profession: new RegExp(search, 'i') },
        { bio: new RegExp(search, 'i') }
      ];
    }

    const professionals = await Professional.find(query)
      .populate('userId', 'name profileImage phone')
      .populate('category', 'name icon')
      .populate('services', 'name')
      .sort({ 'rating.average': -1, 'rating.count': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Professional.countDocuments(query);

    // Apply access control - limit info for guests or users without credits
    const hasAccess = req.user && await hasCredits(req.user._id);
    const mappedProfessionals = professionals.map(prof => {
      const basicInfo = {
        id: prof._id,
        name: prof.userId?.name,
        profession: prof.profession,
        category: prof.category,
        rating: prof.rating,
        location: {
          city: prof.location?.city,
          state: prof.location?.state
        },
        pricing: {
          basePrice: prof.pricing?.basePrice
        },
        isVerified: prof.isVerified,
        profileImage: prof.userId?.profileImage
      };

      if (hasAccess) {
        return {
          ...basicInfo,
          phone: prof.userId?.phone,
          bio: prof.bio,
          experience: prof.experience,
          skills: prof.skills,
          services: prof.services,
          availability: prof.availability,
          workRadius: prof.workRadius,
          fullAddress: prof.location
        };
      }

      return {
        ...basicInfo,
        phone: '***',
        contactLocked: true
      };
    });

    res.json({
      success: true,
      professionals: mappedProfessionals,
      hasAccess,
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

// Helper function to check credits
async function hasCredits(userId) {
  const Wallet = require('../models/Wallet');
  const wallet = await Wallet.findOne({ userId });
  return wallet && wallet.credits >= 1;
}

// @route   GET /api/professionals/:id
// @desc    Get professional by ID (with access control)
// @access  Public (with optional auth)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id)
      .populate('userId', 'name profileImage phone email')
      .populate('category', 'name icon')
      .populate('services', 'name description');

    if (!professional || !professional.isActive) {
      return res.status(404).json({ success: false, message: 'Professional not found' });
    }

    const hasAccess = req.user && await hasCredits(req.user._id);

    const basicInfo = {
      id: professional._id,
      name: professional.userId?.name,
      profession: professional.profession,
      category: professional.category,
      rating: professional.rating,
      location: {
        city: professional.location?.city,
        state: professional.location?.state
      },
      pricing: professional.pricing,
      isVerified: professional.isVerified,
      profileImage: professional.userId?.profileImage
    };

    if (hasAccess) {
      return res.json({
        success: true,
        professional: {
          ...basicInfo,
          phone: professional.userId?.phone,
          email: professional.userId?.email,
          bio: professional.bio,
          experience: professional.experience,
          skills: professional.skills,
          services: professional.services,
          certifications: professional.certifications,
          availability: professional.availability,
          workRadius: professional.workRadius,
          fullAddress: professional.location
        },
        hasAccess: true
      });
    }

    res.json({
      success: true,
      professional: {
        ...basicInfo,
        phone: '***',
        contactLocked: true,
        message: 'Login and unlock with credits to view contact details'
      },
      hasAccess: false
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching professional' });
  }
});

// @route   POST /api/professionals/unlock/:id
// @desc    Unlock professional profile (deducts 1 credit)
// @access  Private
router.post('/unlock/:id', protect, checkCredits(1), async (req, res) => {
  try {
    const professional = await Professional.findById(req.params.id)
      .populate('userId', 'name profileImage phone email')
      .populate('category', 'name icon')
      .populate('services', 'name description');

    if (!professional) {
      return res.status(404).json({ success: false, message: 'Professional not found' });
    }

    // Deduct credit
    await req.wallet.deductCredits(1, `Unlocked profile: ${professional.userId?.name}`, professional._id);

    res.json({
      success: true,
      message: 'Profile unlocked successfully',
      professional: {
        id: professional._id,
        name: professional.userId?.name,
        phone: professional.userId?.phone,
        email: professional.userId?.email,
        profession: professional.profession,
        category: professional.category,
        rating: professional.rating,
        bio: professional.bio,
        experience: professional.experience,
        skills: professional.skills,
        services: professional.services,
        certifications: professional.certifications,
        pricing: professional.pricing,
        availability: professional.availability,
        workRadius: professional.workRadius,
        location: professional.location,
        isVerified: professional.isVerified,
        profileImage: professional.userId?.profileImage
      },
      creditsRemaining: req.wallet.credits - 1
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error unlocking profile' });
  }
});

// @route   POST /api/professionals/register
// @desc    Register as professional
// @access  Private
router.post('/register', protect, [
  body('profession').notEmpty().withMessage('Profession is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('basePrice').isNumeric().withMessage('Base price is required'),
  body('workRadius').isNumeric().withMessage('Work radius is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Check if already registered
    const existing = await Professional.findOne({ userId: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Already registered as professional' });
    }

    const professionalData = {
      userId: req.user._id,
      profession: req.body.profession,
      category: req.body.category,
      pricing: {
        basePrice: req.body.basePrice,
        pricePerHour: req.body.pricePerHour,
        minimumCharge: req.body.minimumCharge
      },
      workRadius: req.body.workRadius,
      bio: req.body.bio,
      skills: req.body.skills || [],
      experience: req.body.experience || 0,
      location: req.body.location
    };

    const professional = await Professional.create(professionalData);

    // Update user role
    await User.findByIdAndUpdate(req.user._id, { role: 'professional' });

    res.status(201).json({
      success: true,
      message: 'Professional registration submitted. Please complete KYC verification.',
      professional
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error registering professional' });
  }
});

// @route   POST /api/professionals/kyc
// @desc    Upload KYC documents
// @access  Private
router.post('/kyc', protect, upload.fields([
  { name: 'idFront', maxCount: 1 },
  { name: 'idBack', maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({ success: false, message: 'Professional not found' });
    }

    const kycData = {
      idType: req.body.idType,
      idNumber: req.body.idNumber,
      status: 'pending'
    };

    if (req.files.idFront) kycData.idFront = `/uploads/kyc/${req.files.idFront[0].filename}`;
    if (req.files.idBack) kycData.idBack = `/uploads/kyc/${req.files.idBack[0].filename}`;
    if (req.files.addressProof) kycData.addressProof = `/uploads/kyc/${req.files.addressProof[0].filename}`;
    if (req.files.photo) kycData.photo = `/uploads/kyc/${req.files.photo[0].filename}`;

    professional.kyc = kycData;
    await professional.save();

    res.json({
      success: true,
      message: 'KYC documents uploaded. Awaiting admin approval.',
      professional
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error uploading KYC' });
  }
});

// @route   GET /api/professionals/dashboard/stats
// @desc    Get professional dashboard stats
// @access  Private (Professional only)
router.get('/dashboard/stats', protect, async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({ success: false, message: 'Professional not found' });
    }

    const Booking = require('../models/Booking');
    const Wallet = require('../models/Wallet');

    const stats = {
      totalBookings: await Booking.countDocuments({ professional: professional._id }),
      pendingBookings: await Booking.countDocuments({ professional: professional._id, status: 'pending' }),
      activeBookings: await Booking.countDocuments({ professional: professional._id, status: { $in: ['accepted', 'on_the_way', 'in_progress'] } }),
      completedBookings: await Booking.countDocuments({ professional: professional._id, status: 'completed' }),
      rating: professional.rating,
      wallet: null
    };

    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (wallet) {
      stats.wallet = {
        balance: wallet.balance,
        credits: wallet.credits
      };
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching dashboard stats' });
  }
});

// @route   GET /api/professionals/dashboard/jobs
// @desc    Get job requests for professional
// @access  Private (Professional only)
router.get('/dashboard/jobs', protect, async (req, res) => {
  try {
    const professional = await Professional.findOne({ userId: req.user._id });
    if (!professional) {
      return res.status(404).json({ success: false, message: 'Professional not found' });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const query = { professional: professional._id };
    if (status) query.status = status;

    const Booking = require('../models/Booking');
    const bookings = await Booking.find(query)
      .populate('user', 'name profileImage')
      .populate('service', 'name')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    // Apply access control - limit user info if professional doesn't have credits
    const Wallet = require('../models/Wallet');
    const wallet = await Wallet.findOne({ userId: req.user._id });
    const hasAccess = wallet && wallet.credits >= 1;

    const mappedBookings = bookings.map(booking => {
      const basicInfo = {
        id: booking._id,
        service: booking.service,
        category: booking.category,
        status: booking.status,
        serviceDate: booking.serviceDate,
        serviceTime: booking.serviceTime,
        address: booking.address,
        pricing: booking.pricing,
        user: {
          name: booking.user?.name,
          profileImage: booking.user?.profileImage
        }
      };

      if (hasAccess || booking.status !== 'pending') {
        return {
          ...basicInfo,
          user: {
            ...basicInfo.user,
            phone: booking.user?.phone,
            email: booking.user?.email
          }
        };
      }

      return {
        ...basicInfo,
        user: {
          ...basicInfo.user,
          phone: '***',
          contactLocked: true
        }
      };
    });

    res.json({
      success: true,
      bookings: mappedBookings,
      hasAccess,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching jobs' });
  }
});

module.exports = router;

