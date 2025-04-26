const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true, 
    index: true 
  },
  items: [
    {
      productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Product", 
        required: true 
      },
      quantity: { 
        type: Number, 
        default: 1,
        min: [1, 'Quantity cannot be less than 1'],
        max: [50, 'Quantity cannot exceed 50 items']
      },
      price: { 
        type: Number,
        min: 0
      },
      name: { 
        type: String
      },
      image: { 
        type: String
      },
      weight: {
        type: Number,
        min: 0
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  totalItems: {
    type: Number,
    default: 0
  },
  totalQuantity: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isAbandoned: {
    type: Boolean,
    default: false
  },
  promoCode: {
    type: String,
    default: null
  },
  promoDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingMethod: {
    type: String,
    enum: ['Standard', 'Express', 'Same Day', null],
    default: null
  },
  shippingFee: {
    type: Number,
    default: 0,
    min: 0
  },
  estimatedTotal: {
    type: Number,
    default: 0,
    min: 0
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
CartSchema.index({ userId: 1, "items.productId": 1 });
CartSchema.index({ createdAt: 1 });
CartSchema.index({ lastActive: 1 });
CartSchema.index({ isAbandoned: 1 });

// Recalculate cart totals on save
CartSchema.pre('save', function(next) {
  this.totalItems = this.items.length;
  this.totalQuantity = this.items.reduce((total, item) => total + item.quantity, 0);
  this.subtotal = this.items.reduce((total, item) => {
    return total + ((item.price || 0) * item.quantity);
  }, 0);
  this.estimatedTotal = this.subtotal - this.promoDiscount + this.shippingFee;
  this.lastActive = new Date();
  next();
});

// Virtual to check if cart is empty
CartSchema.virtual('isEmpty').get(function() {
  return this.items.length === 0;
});

// Method to find abandoned carts
CartSchema.statics.findAbandoned = function(hoursThreshold = 24) {
  const thresholdDate = new Date();
  thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold);
  
  return this.find({
    lastActive: { $lt: thresholdDate },
    isAbandoned: false,
    'items.0': { $exists: true } // Has at least one item
  });
};

const Cart = mongoose.model("Cart", CartSchema);
module.exports = Cart;
