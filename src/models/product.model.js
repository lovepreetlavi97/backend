const mongoose = require('mongoose');

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
    type: [String],  // Array of image URLs
    required: true,
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
