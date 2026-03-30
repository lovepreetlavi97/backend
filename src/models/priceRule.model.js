const mongoose = require("mongoose");

const priceRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true // so no duplicate rules for "Gold"
    },
    metalIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Metal',
    }],

    price: {
      type: Number,
      required: true,
      min: 0,
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

priceRuleSchema.index({ name: 1, isActive: 1 });
priceRuleSchema.index({ metalIds: 1 });

const PriceRule = mongoose.model("PriceRule", priceRuleSchema);

module.exports = PriceRule;
