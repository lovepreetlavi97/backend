const mongoose = require('mongoose');

const metalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  colorCode: {
    type: String,
    required: true, // Example: '#D4AF37'
  },
  gradient: {
    type: String,
    required: true, // Example: 'linear-gradient(to right, #D4AF37, #F9D05F)'
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  position: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Adding index on slug for fast searching
metalSchema.index({ slug: 1 });

const Metal = mongoose.model('Metal', metalSchema);

module.exports = Metal;
