const mongoose = require('mongoose');
const slugify = require('slugify');
const DEFAULT_IMAGE_URL = "https://plus.unsplash.com/premium_photo-1664124381855-3131b9a386d8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    index: true,
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
  }],
  images: {
    type: [String],
    default: [DEFAULT_IMAGE_URL],
    validate: [
      {
        validator: function(v) {
          return v.length <= 5;
        },
        message: 'Cannot have more than 5 images per category'
      }
    ]
  },
  icon: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    select: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  featuredImage: {
    type: String,
    default: null,
  },
  metaTitle: {
    type: String,
    trim: true,
  },
  metaDescription: {
    type: String,
    trim: true,
  },
  productCount: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ isDeleted: 1, isBlocked: 1, isActive: 1 });
categorySchema.index({ displayOrder: 1 });

// Generate slug from name
categorySchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Don't show deleted categories in queries
categorySchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Add a virtual to get products count (use with populate)
categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'categoryId',
  count: true,
});

module.exports = mongoose.model('Category', categorySchema);
