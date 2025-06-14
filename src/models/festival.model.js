const mongoose = require('mongoose');
const slugify = require('slugify');
const DEFAULT_IMAGE_URL = "https://plus.unsplash.com/premium_photo-1664124381855-3131b9a386d8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const festivalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    unique: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  image: {
    type: String,
    default: DEFAULT_IMAGE_URL
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Pre-save middleware to generate slug
festivalSchema.pre('save', function(next) {
  // Only generate slug if name is modified or it's a new document
  if (this.isModified('name') || this.isNew) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Virtual to check if the festival is expired
festivalSchema.virtual('isExpired').get(function() {
  return Date.now() > this.endDate;
});

// Add indexes for faster queries
festivalSchema.index({ name: 1 });
festivalSchema.index({ slug: 1 });
festivalSchema.index({ isActive: 1 });
festivalSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Festival', festivalSchema);
