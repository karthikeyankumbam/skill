const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  credits: {
    type: Number,
    default: 0,
    min: 0
  },
  transactions: [{
    type: {
      type: String,
      enum: ['credit', 'debit', 'refund', 'withdrawal', 'referral', 'booking', 'unlock', 'subscription'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    credits: {
      type: Number,
      default: 0
    },
    description: String,
    referenceId: String, // booking ID, transaction ID, etc.
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'completed'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
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

walletSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to add credits
walletSchema.methods.addCredits = function(amount, description, referenceId) {
  const creditValue = process.env.CREDIT_VALUE_IN_RUPEES || 10;
  const creditsToAdd = Math.floor(amount / creditValue);
  
  this.credits += creditsToAdd;
  this.balance += amount;
  
  this.transactions.push({
    type: 'credit',
    amount,
    credits: creditsToAdd,
    description,
    referenceId,
    status: 'completed'
  });
  
  return this.save();
};

// Method to deduct credits
walletSchema.methods.deductCredits = function(credits, description, referenceId) {
  if (this.credits < credits) {
    throw new Error('Insufficient credits');
  }
  
  const creditValue = process.env.CREDIT_VALUE_IN_RUPEES || 10;
  const amount = credits * creditValue;
  
  this.credits -= credits;
  this.balance = Math.max(0, this.balance - amount);
  
  this.transactions.push({
    type: 'debit',
    amount: -amount,
    credits: -credits,
    description,
    referenceId,
    status: 'completed'
  });
  
  return this.save();
};

module.exports = mongoose.model('Wallet', walletSchema);

