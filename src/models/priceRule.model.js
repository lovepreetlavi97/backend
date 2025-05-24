const mongoose = require("mongoose");

const priceRuleSchema = new mongoose.Schema(
  {
    // Required fields
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["fixed", "percentage"],
      required: true,
    },

    value: {
      type: Number,
      required: true,
      min: 0,
    },

    // Optional fields
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    subcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
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
  { timestamps: true }
);

// Virtual to check if the price rule is expired
priceRuleSchema.virtual("isExpired").get(function () {
  if (!this.endDate) return false;
  return Date.now() > this.endDate;
});

// Add indexes for faster queries
priceRuleSchema.index({ name: 1 });
priceRuleSchema.index({ type: 1 });
priceRuleSchema.index({ isActive: 1 });
priceRuleSchema.index({ categoryId: 1 });
priceRuleSchema.index({ subcategoryId: 1 });
priceRuleSchema.index({ productId: 1 });
priceRuleSchema.index({ startDate: 1, endDate: 1 });

const PriceRule = mongoose.model("PriceRule", priceRuleSchema);

module.exports = PriceRule;
