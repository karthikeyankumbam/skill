const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  minPurchase: {
    type: Number,
    default: 0
  },
  maxDiscount: Number,
  applicableTo: {
    categories: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }],
    cities: [String],
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  validFrom: {
    type: Date,
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

couponSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

couponSchema.methods.isValid = function(amount, category, city, userId) {
  const now = new Date();
  
  if (!this.isActive) return { valid: false, message: 'Coupon is not active' };
  if (now < this.validFrom || now > this.validUntil) {
    return { valid: false, message: 'Coupon has expired' };
  }
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }
  if (amount < this.minPurchase) {
    return { valid: false, message: `Minimum purchase of ₹${this.minPurchase} required` };
  }
  if (this.applicableTo.categories.length > 0 && 
      !this.applicableTo.categories.includes(category)) {
    return { valid: false, message: 'Coupon not applicable for this category' };
  }
  if (this.applicableTo.cities.length > 0 && 
      !this.applicableTo.cities.includes(city)) {
    return { valid: false, message: 'Coupon not applicable in your city' };
  }
  if (this.applicableTo.users.length > 0 && 
      !this.applicableTo.users.includes(userId)) {
    return { valid: false, message: 'Coupon not applicable for this user' };
  }
  
  return { valid: true };
};

module.exports = mongoose.model('Coupon', couponSchema);

