const mongoose = require('mongoose');
const DEFAULT_IMAGE_URL = "https://via.placeholder.com/800x400?text=Banner+Image";

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['home', 'category', 'popup', 'slider'],
    default: 'home'
  },
  imageUrl: {
    type: String,
    default: DEFAULT_IMAGE_URL
  },
  link: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'scheduled'],
    default: 'active'
  },
  position: {
    type: Number,
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Add indexes for faster queries
bannerSchema.index({ title: 1 });
bannerSchema.index({ type: 1 });
bannerSchema.index({ status: 1 });
bannerSchema.index({ position: 1 });
bannerSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
