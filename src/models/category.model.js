const mongoose = require('mongoose');
const slugify = require('slugify');


const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
  },
  description: {
    type: String,
  },
  slug: {
    type: String,
    unique: true
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
  }],
  image: {
    type: String,
     default: "",
  },
  isFeatured: {
    type: Boolean,
    default: false,
    select: false,
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
categorySchema.index({ isDeleted: 1, isBlocked: 1 });

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


module.exports = mongoose.model('Category', categorySchema);
