const mongoose = require('mongoose');
const DEFAULT_ICON_URL = "https://plus.unsplash.com/premium_photo-1664124381855-3131b9a386d8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const relationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    default: DEFAULT_ICON_URL
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

// Add indexes for faster queries
relationSchema.index({ name: 1 });
relationSchema.index({ isActive: 1 });
relationSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Relation', relationSchema);
