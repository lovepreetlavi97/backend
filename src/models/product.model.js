const mongoose = require('mongoose');
const slugify = require('slugify');
const DEFAULT_IMAGE_URL = "https://plus.unsplash.com/premium_photo-1664124381855-3131b9a386d8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters'],
  },
  slug: {
    type: String,
    unique: true,
    index: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [200, 'Short description cannot exceed 200 characters'],
  },
  actualPrice: {
    type: Number,
    required: [true, 'Actual price is required'],
    min: [0, 'Price cannot be negative'],
  },
  discountedPrice: {
    type: Number,
    min: [0, 'Discounted price cannot be negative'],
    validate: {
      validator: function(value) {
        return value <= this.actualPrice;
      },
      message: 'Discounted price must be less than or equal to actual price'
    }
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [0, 'Weight cannot be negative'],
  },
  unit: {
    type: String,
    enum: ['kg', 'g', 'lb', 'oz', 'pieces'],
    default: 'kg',
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  images: {
    type: [String],
    default: [DEFAULT_IMAGE_URL],
    validate: [
      {
        validator: function(v) {
          return v.length <= 10;
        },
        message: 'Cannot have more than 10 images per product'
      }
    ]
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true,
  },
  subcategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory',
    index: true,
  },
  festivalIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Festival',
  }],
  relationIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Relation',
  }],
  specifications: [{
    name: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    }
  }],
  tags: [String],
  isDeleted: {
    type: Boolean,
    default: false,
    select: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  isInStock: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
    get: function() {
      if (!this.actualPrice || !this.discountedPrice) return 0;
      return Math.round(((this.actualPrice - this.discountedPrice) / this.actualPrice) * 100);
    }
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'inch'],
      default: 'cm'
    }
  },
  shippingInfo: {
    isFreeShipping: {
      type: Boolean,
      default: false,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    estimatedDeliveryDays: {
      type: Number,
      default: 3,
    },
  },
  warranty: {
    type: String,
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
  toJSON: { getters: true, virtuals: true },
  toObject: { getters: true, virtuals: true }
});

// Indexes for performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ actualPrice: 1, discountedPrice: 1 });
productSchema.index({ isDeleted: 1, isBlocked: 1, isInStock: 1 });
productSchema.index({ categoryId: 1, subcategoryId: 1 });
productSchema.index({ isFeatured: 1 });

// Virtual for calculating discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (!this.actualPrice || !this.discountedPrice) return 0;
  return Math.round(((this.actualPrice - this.discountedPrice) / this.actualPrice) * 100);
});

// Auto-generate slug before saving
productSchema.pre('save', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
    
    // Add a random string to ensure uniqueness
    if (this.isNew) {
      const randomStr = Math.random().toString(36).substring(2, 8);
      this.slug = `${this.slug}-${randomStr}`;
    }
  }
  
  // Auto-update stock status
  if (this.isModified('stock')) {
    this.isInStock = this.stock > 0;
  }
  
  next();
});

// Don't show deleted products in queries
productSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('Product', productSchema);
