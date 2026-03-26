const mongoose = require("mongoose");

const curatedCollectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      unique: true
    },

    image: {
      type: String,
      required: true
    },

    filters: {
      categoryIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
      }],

      subcategoryIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subcategory"
      }],

      relationIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Relation"
      }],

      festivalIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Festival"
      }],

      priceRange: {
        min: Number,
        max: Number
      }
    },

    productIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product"
    }],

    position: {
      type: Number,
      default: 0
    },

    isActive: {
      type: Boolean,
      default: true
    },

    isDeleted: {
      type: Boolean,
      default: false,
      select: false
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin"
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CuratedCollection", curatedCollectionSchema);
