const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema(
  {
    // ✅ Required
    code: {
      type: String,
      required: [true, "Promo code is required"],
      unique: true,
      trim: true,
    },

    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: [true, "Discount type is required"],
    },

    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value must be non-negative"],
    },

    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // 🔁 Optional
    maxDiscount: {
      type: Number,
      default: null,
    },

    minOrderValue: {
      type: Number,
      default: 0,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    // ✅ New fields for global usage tracking
    usageLimit: {
      type: Number,
      default: null, // Null = unlimited usage
    },
    usedCount: {
      type: Number,
      default: 0,
    },

    // ✅ Track which users used this code
    usedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // 🔁 User-level restriction
    userRestrictions: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  { timestamps: true }
);

// 🔍 Virtual to check expiry status
promoCodeSchema.virtual("isExpired").get(function () {
  return Date.now() > this.expiryDate;
});

module.exports = mongoose.model("PromoCode", promoCodeSchema);
