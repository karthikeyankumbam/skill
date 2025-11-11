const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  nameLocalized: {
    en: String,
    te: String,
    hi: String,
    ta: String,
    kn: String
  },
  icon: String,
  image: String,
  description: String,
  descriptionLocalized: {
    en: String,
    te: String,
    hi: String,
    ta: String,
    kn: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
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

categorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Category', categorySchema);

