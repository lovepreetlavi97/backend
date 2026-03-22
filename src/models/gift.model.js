const mongoose = require('mongoose');

const giftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Gift name is required'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    image: {
      type: String,
      required: [true, 'Gift image is required'],
    },
    description: {
      type: String,
      trim: true,
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

// Index for performance
giftSchema.index({ slug: 1 });
giftSchema.index({ isActive: 1, isDeleted: 1 });

const Gift = mongoose.model('Gift', giftSchema);

module.exports = Gift;
