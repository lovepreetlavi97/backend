const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema(
  {
    // ✅ Required
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },

    value: {
      type: Number,
      required: true,
      min: 0,
    },

    minPurchase: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    maxDiscount: {
      type: Number,
      required: true,
      min: 0,
    },

    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    endDate: {
      type: Date,
      required: true,
    },

    usageLimit: {
      type: Number,
      required: true,
      min: 0,
    },

    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    description: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },

    // 🔁 Optional
    minOrderValue: {
      type: Number,
      default: 0,
    },

    // ✅ New fields for global usage tracking
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
  return Date.now() > this.endDate;
});

// Add index for faster queries
promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ status: 1 });
promoCodeSchema.index({ startDate: 1, endDate: 1 });

const PromoCode = mongoose.model("PromoCode", promoCodeSchema);

module.exports = PromoCode;
