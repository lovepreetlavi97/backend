const mongoose = require('mongoose');
const DEFAULT_IMAGE_URL = "https://plus.unsplash.com/premium_photo-1664124381855-3131b9a386d8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category', // Assuming you have subcategories in the same collection
  }],
  image: {
    type: String,
    default:DEFAULT_IMAGE_URL
  },
  isDeleted: {
    type: Boolean,
    default:false,
  },
  isBlocked: {
    type: Boolean,
    default:false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
