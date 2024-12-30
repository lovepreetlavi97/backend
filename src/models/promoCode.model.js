const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'], // Defines if the discount is a percentage or a fixed amount
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0, // Ensures a non-negative value for discount
  },
  maxDiscount: {
    type: Number,
    default: null, // Optional field for max discount on percentage-based codes
  },
  minOrderValue: {
    type: Number,
    default: 0, // Minimum order amount to apply the promo code
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  usageLimit: {
    type: Number,
    default: null, // Null for no usage limit
  },
  usedCount: {
    type: Number,
    default: 0, // Tracks the number of times the promo code has been used
  },
  userRestrictions: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: [], // Array of user IDs if specific users are restricted
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Virtual field to check if the promo code is expired
promoCodeSchema.virtual('isExpired').get(function () {
  return Date.now() > this.expiryDate;
});

module.exports = mongoose.model('PromoCode', promoCodeSchema);
