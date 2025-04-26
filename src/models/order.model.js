const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  products: [
    {
      productId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Product', 
        required: true 
      },
      name: { 
        type: String, 
        required: true 
      },
      slug: { 
        type: String
      },
      price: { 
        type: Number, 
        required: true,
        min: 0
      },
      quantity: { 
        type: Number, 
        required: true,
        min: 1
      },
      weight: {
        type: Number,
        min: 0
      },
      image: {
        type: String
      },
      subtotal: { 
        type: Number, 
        required: true,
        min: 0
      }
    }
  ],
  shippingCharge: { 
    type: Number, 
    default: 0,
    min: 0
  }, 
  tax: { 
    type: Number, 
    default: 0,
    min: 0
  }, 
  taxAmount: { 
    type: Number, 
    default: 0,
    min: 0
  }, 
  totalAmount: { 
    type: Number, 
    required: true,
    min: 0
  }, 
  discountAmount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  finalAmount: { 
    type: Number, 
    required: true,
    min: 0
  }, 
  promoCode: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PromoCode', 
    default: null 
  },
  promoDetails: {
    code: String,
    discountType: { 
      type: String,
      enum: ['percentage', 'fixed']
    },
    discountValue: Number
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded'],
    default: 'Pending',
    index: true,
  },
  shippingAddress: {
    addressLine1: {
      type: String,
      required: true,
    },
    addressLine2: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    contactPhone: {
      type: String,
      required: true,
    },
    contactName: {
      type: String,
      required: true,
    },
  },
  billingAddress: {
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    contactPhone: String,
    contactName: String,
  },
  paymentMethod: {
    type: String,
    enum: ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'COD', 'Wallet', 'PayPal'],
    required: true,
  },
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Failed', 'Refunded', 'Partially Refunded'], 
    default: 'Pending',
    index: true,
  },
  paymentDetails: {
    transactionId: String,
    paymentGateway: String,
    paymentMethod: String,
    cardLastFour: String,
    cardBrand: String,
  },
  estimatedDelivery: { 
    type: Date 
  },
  deliveredAt: { 
    type: Date 
  },
  cancelledAt: { 
    type: Date 
  },
  returnedAt: { 
    type: Date 
  },
  refundedAt: { 
    type: Date 
  },
  cancellationReason: {
    type: String
  },
  returnReason: {
    type: String
  },
  refundAmount: {
    type: Number,
    min: 0
  },
  notes: {
    type: String
  },
  adminNotes: {
    type: String
  },
  deliveryInstructions: {
    type: String
  },
  giftWrap: {
    type: Boolean,
    default: false
  },
  giftMessage: {
    type: String
  },
  invoiceUrl: {
    type: String
  },
  tracking: {
    carrier: String,
    trackingNumber: String,
    trackingUrl: String,
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded'],
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    comment: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    }
  }],
  isDeleted: { 
    type: Boolean, 
    default: false,
    select: false,
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1, paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ isDeleted: 1 });

// Generate unique order number
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Only generate order number for new orders
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${dateStr}-${randomPart}`;
    
    // Initialize status history for new orders
    this.statusHistory = [{ 
      status: this.status,
      timestamp: new Date(),
      comment: 'Order created'
    }];
  } else if (this.isModified('status')) {
    // Add to status history when status changes
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
    
    // Update timestamp fields based on status
    if (this.status === 'Delivered') {
      this.deliveredAt = new Date();
    } else if (this.status === 'Cancelled') {
      this.cancelledAt = new Date();
    } else if (this.status === 'Returned') {
      this.returnedAt = new Date();
    } else if (this.status === 'Refunded') {
      this.refundedAt = new Date();
    }
  }
  next();
});

// Don't show deleted orders in queries
orderSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Virtual for calculating days since order
orderSchema.virtual('daysSinceOrder').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Order', orderSchema);
