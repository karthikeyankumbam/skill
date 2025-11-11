const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { optionalAuth } = require('../middleware/auth');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const categories = await Category.find(query)
      .sort({ sortOrder: 1, name: 1 });

    // Return localized names based on user language
    const userLanguage = req.user?.language || 'en';
    const mappedCategories = categories.map(cat => ({
      id: cat._id,
      name: cat.nameLocalized?.[userLanguage] || cat.name,
      icon: cat.icon,
      image: cat.image,
      description: cat.descriptionLocalized?.[userLanguage] || cat.description,
      isActive: cat.isActive
    }));

    res.json({
      success: true,
      categories: mappedCategories
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching categories' });
  }
});

// @route   GET /api/categories/:id
// @desc    Get category by ID
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const userLanguage = req.user?.language || 'en';

    res.json({
      success: true,
      category: {
        id: category._id,
        name: category.nameLocalized?.[userLanguage] || category.name,
        icon: category.icon,
        image: category.image,
        description: category.descriptionLocalized?.[userLanguage] || category.description,
        isActive: category.isActive
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error fetching category' });
  }
});

module.exports = router;

