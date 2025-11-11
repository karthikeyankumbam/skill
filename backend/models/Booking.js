const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'on_the_way', 'in_progress', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  serviceDate: {
    type: Date,
    required: true
  },
  serviceTime: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  description: String,
  pricing: {
    basePrice: Number,
    additionalCharges: Number,
    discount: Number,
    totalAmount: Number,
    paidAmount: Number,
    paymentMethod: {
      type: String,
      enum: ['wallet', 'razorpay', 'cash']
    },
    creditsUsed: {
      type: Number,
      default: 0
    }
  },
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['user', 'professional', 'admin']
    },
    cancelledAt: Date,
    reason: String,
    refundAmount: Number,
    cancellationFee: Number
  },
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  },
  chatRoomId: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  acceptedAt: Date,
  completedAt: Date
});

bookingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Generate chat room ID
  if (!this.chatRoomId) {
    this.chatRoomId = `room_${this._id}`;
  }
  
  next();
});

// Calculate total amount
bookingSchema.methods.calculateTotal = function() {
  const total = (this.pricing.basePrice || 0) + 
                (this.pricing.additionalCharges || 0) - 
                (this.pricing.discount || 0);
  this.pricing.totalAmount = total;
  return total;
};

module.exports = mongoose.model('Booking', bookingSchema);

