const mongoose = require('mongoose');

const priceFilterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    minPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    maxPrice: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
priceFilterSchema.index({ minPrice: 1, maxPrice: 1 });
priceFilterSchema.index({ isActive: 1, isDeleted: 1 });

module.exports = mongoose.model('PriceFilter', priceFilterSchema);
