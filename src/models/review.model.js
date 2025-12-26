const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },

    title: {
      type: String,
      trim: true
    },

    reviewText: {
      type: String,
      trim: true
    },

    images: [
      {
        type: String
      }
    ],

    helpfulCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Prevent duplicate reviews by same user on same product
ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);
