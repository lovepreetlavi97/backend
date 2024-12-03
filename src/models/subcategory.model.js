const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category', // Reference to the Category model
    required: true,
  },
  originalPrice: {
    type: Number,
    required: true,
  },
  discountedPrice: {
    type: Number,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  image: {
    type: Object,
    default: {},
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

module.exports = mongoose.model('Subcategory', subcategorySchema);
