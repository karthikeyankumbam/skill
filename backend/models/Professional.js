const mongoose = require('mongoose');

const professionalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  profession: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  experience: {
    type: Number,
    default: 0
  },
  bio: String,
  skills: [String],
  certifications: [{
    name: String,
    issuer: String,
    issueDate: Date,
    certificateUrl: String
  }],
  kyc: {
    idType: {
      type: String,
      enum: ['aadhar', 'pan', 'driving_license', 'passport']
    },
    idNumber: String,
    idFront: String,
    idBack: String,
    addressProof: String,
    photo: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    verifiedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  pricing: {
    basePrice: {
      type: Number,
      required: true
    },
    pricePerHour: Number,
    minimumCharge: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  workRadius: {
    type: Number,
    default: 10, // in km
    required: true
  },
  availability: {
    monday: { available: Boolean, slots: [String] },
    tuesday: { available: Boolean, slots: [String] },
    wednesday: { available: Boolean, slots: [String] },
    thursday: { available: Boolean, slots: [String] },
    friday: { available: Boolean, slots: [String] },
    saturday: { available: Boolean, slots: [String] },
    sunday: { available: Boolean, slots: [String] }
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  jobLeadsUsed: {
    type: Number,
    default: 0
  },
  jobLeadsLimit: {
    type: Number,
    default: 10 // Free plan limit
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: false // Inactive until KYC approved
  },
  location: {
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  referredBy: {
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

professionalSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update job leads limit based on subscription
professionalSchema.pre('save', function(next) {
  if (this.subscription.plan === 'pro') {
    this.jobLeadsLimit = Infinity;
  } else {
    this.jobLeadsLimit = 10;
  }
  next();
});

module.exports = mongoose.model('Professional', professionalSchema);

