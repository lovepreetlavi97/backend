const mongoose = require('mongoose');
const DEFAULT_IMAGE_URL = "https://plus.unsplash.com/premium_photo-1664124381855-3131b9a386d8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  actualPrice: {
    type: Number,
    required: true,
  },
  discountedPrice: {
    type: Number,
  },
  weight: {
    type: Number,
    required: true,
  },
  images: {
    type: [String], // Declares it as an array of strings
    default: [DEFAULT_IMAGE_URL] // Sets the default as an array with the default URL
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  subcategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  festivalIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Festival',
  }],
  relationIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Relation',
  }],
  isDeleted: {
    type: Boolean,
    default:false,
  },
  isBlocked: {
    type: Boolean,
    default:false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
