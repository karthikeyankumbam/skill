const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  professional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Professional',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: String,
  photos: [String],
  isVerified: {
    type: Boolean,
    default: false
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  reportedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    reportedAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

reviewSchema.pre('save', async function(next) {
  this.updatedAt = Date.now();
  
  // Update professional rating when review is created/updated
  if (this.isNew || this.isModified('rating')) {
    const Professional = mongoose.model('Professional');
    const professional = await Professional.findById(this.professional);
    
    if (professional) {
      const reviews = await mongoose.model('Review').find({
        professional: this.professional,
        isVisible: true
      });
      
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      professional.rating.average = totalRating / reviews.length;
      professional.rating.count = reviews.length;
      await professional.save();
    }
  }
  
  next();
});

module.exports = mongoose.model('Review', reviewSchema);

