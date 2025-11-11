const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { optionalAuth } = require('../middleware/auth');

// @route   GET /api/services
// @desc    Get all services
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const services = await Service.find(query)
      .populate('category', 'name icon')
      .sort({ name: 1 });

    const userLanguage = req.user?.language || 'en';
    const mappedServices = services.map(service => ({
      id: service._id,
      name: service.nameLocalized?.[userLanguage] || service.name,
      category: service.category,
      description: service.descriptionLocalized?.[userLanguage] || service.description,
      icon: service.icon,
      image: service.image,
      isActive: service.isActive
    }));

    res.json({
      success: true,
      services: mappedServices
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching services' });
  }
});

// @route   GET /api/services/:id
// @desc    Get service by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('category', 'name icon');

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const userLanguage = req.user?.language || 'en';

    res.json({
      success: true,
      service: {
        id: service._id,
        name: service.nameLocalized?.[userLanguage] || service.name,
        category: service.category,
        description: service.descriptionLocalized?.[userLanguage] || service.description,
        icon: service.icon,
        image: service.image,
        isActive: service.isActive
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching service' });
  }
});

module.exports = router;

