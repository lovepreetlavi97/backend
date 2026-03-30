const mongoose = require('mongoose');

// Define the default image URL as a constant for reusability
const DEFAULT_IMAGE_URL = "https://plus.unsplash.com/premium_photo-1664124381855-3131b9a386d8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true, // Trim whitespace from the name
  },
  metalIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Metal',
    required: true,
  }],
  // Backward-compatible category reference (legacy)
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false,
  },
  // New canonical category reference
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false,
    index: true,
  },
  // New parent reference for multi-level nesting
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory',
    default: null,
    index: true,
  },
  image: {
    type: String,
    default: ""
  },
  isFeatured: {
    type: Boolean,
    default: false,
    select: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  slug: {
    type: String,
    unique: true
  },
}, { timestamps: true });

// Generate slug from name
subcategorySchema.pre('save', function (next) {
  const slugify = require('slugify');
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Keep backward compatibility: if only one of category/categoryId is set, mirror it.
subcategorySchema.pre('save', function (next) {
  if (!this.categoryId && this.category) this.categoryId = this.category;
  if (!this.category && this.categoryId) this.category = this.categoryId;
  next();
});

subcategorySchema.index({ categoryId: 1, parentId: 1, name: 1, slug: 1 });
subcategorySchema.index({ metalIds: 1 });

module.exports = mongoose.model('Subcategory', subcategorySchema);
