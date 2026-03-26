const mongoose = require('mongoose');

const kittyPaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Payment amount cannot be negative']
  },
  paymentDate: {
    type: Date,
    default: null
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'overdue', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'bank_transfer', 'cash'],
    default: null
  },
  transactionId: {
    type: String,
    trim: true,
    default: null
  },
  razorpayOrderId: {
    type: String,
    trim: true,
    default: null
  },
  razorpayPaymentId: {
    type: String,
    trim: true,
    default: null
  },
  razorpaySignature: {
    type: String,
    trim: true,
    default: null
  },
  failureReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Failure reason cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

const userKittySchema = new mongoose.Schema({
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KittyPlan',
    required: [true, 'Plan ID is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  nextPaymentDate: {
    type: Date,
    required: [true, 'Next payment date is required']
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled', 'pending'],
    default: 'pending'
  },
  monthlyAmount: {
    type: Number,
    required: [true, 'Monthly amount is required'],
    min: [0, 'Monthly amount cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative']
  },
  maturityAmount: {
    type: Number,
    required: [true, 'Maturity amount is required'],
    min: [0, 'Maturity amount cannot be negative']
  },
  totalPaid: {
    type: Number,
    default: 0,
    min: [0, 'Total paid cannot be negative']
  },
  remainingAmount: {
    type: Number,
    required: [true, 'Remaining amount is required'],
    min: [0, 'Remaining amount cannot be negative']
  },
  payments: [kittyPaymentSchema],
  pausedDate: {
    type: Date,
    default: null
  },
  cancelledDate: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  },
  completedDate: {
    type: Date,
    default: null
  },
  maturityPaidDate: {
    type: Date,
    default: null
  },
  autoPaymentEnabled: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for progress calculation
userKittySchema.virtual('progress').get(function () {
  const totalMonths = Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24 * 30));
  const completedPayments = this.payments.filter(p => p.status === 'paid').length;
  const percentage = totalMonths > 0 ? (completedPayments / totalMonths) * 100 : 0;

  return {
    completedMonths: completedPayments,
    totalMonths: totalMonths,
    percentage: Math.round(percentage)
  };
});

// Virtual for overdue payments
userKittySchema.virtual('overduePayments').get(function () {
  const now = new Date();
  return this.payments.filter(payment =>
    payment.status === 'pending' &&
    new Date(payment.dueDate) < now
  );
});

// Virtual for next payment amount
userKittySchema.virtual('nextPaymentAmount').get(function () {
  if (this.status !== 'active') return 0;
  const nextPayment = this.payments.find(p => p.status === 'pending');
  return nextPayment ? nextPayment.amount : 0;
});

// Indexes for better performance
userKittySchema.index({ userId: 1, status: 1 });
userKittySchema.index({ planId: 1, status: 1 });
userKittySchema.index({ nextPaymentDate: 1 });
userKittySchema.index({ createdAt: -1 });

// Compound index for user's active kitties
userKittySchema.index({ userId: 1, status: 1, createdAt: -1 });

// Pre-save middleware to calculate dates
userKittySchema.pre('save', function (next) {
  if (this.isNew && !this.endDate) {
    // Calculate end date based on plan duration
    const durationInMonths = 12; // This should come from the plan
    this.endDate = new Date(this.startDate);
    this.endDate.setMonth(this.endDate.getMonth() + durationInMonths);
  }

  if (this.isNew && !this.nextPaymentDate) {
    // Set next payment date to 30 days from start
    this.nextPaymentDate = new Date(this.startDate);
    this.nextPaymentDate.setMonth(this.nextPaymentDate.getMonth() + 1);
  }

  next();
});

// Pre-save middleware to update totalPaid
userKittySchema.pre('save', function (next) {
  if (this.isModified('payments')) {
    this.totalPaid = this.payments
      .filter(payment => payment.status === 'paid')
      .reduce((sum, payment) => sum + payment.amount, 0);

    this.remainingAmount = Math.max(0, this.totalAmount - this.totalPaid);
  }
  next();
});

// Static method to find user's active kitties
userKittySchema.statics.findUserActiveKitties = function (userId) {
  return this.find({ userId, status: 'active' })
    .populate('planId')
    .sort({ createdAt: -1 });
};

// Static method to find user's all kitties
userKittySchema.statics.findUserAllKitties = function (userId) {
  return this.find({ userId })
    .populate('planId')
    .sort({ createdAt: -1 });
};

// Static method to find overdue payments
userKittySchema.statics.findOverduePayments = function () {
  const now = new Date();
  return this.find({
    status: 'active',
    'payments.status': 'pending',
    'payments.dueDate': { $lt: now }
  }).populate('userId planId');
};

// Instance method to generate next payment
userKittySchema.methods.generateNextPayment = function () {
  if (this.status !== 'active') return null;

  // Get the payment with the latest due date to ensure we follow the schedule
  const lastScheduled = [...this.payments].sort((a, b) =>
    new Date(b.dueDate) - new Date(a.dueDate)
  )[0];

  if (!lastScheduled) {
    return {
      amount: this.monthlyAmount,
      dueDate: this.nextPaymentDate || new Date(),
      status: 'pending'
    };
  }

  // Calculate next due date: 1 month after the last scheduled due date
  const nextDueDate = new Date(lastScheduled.dueDate);
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);

  return {
    amount: this.monthlyAmount,
    dueDate: nextDueDate,
    status: 'pending'
  };
};

// Instance method to mark as completed
userKittySchema.methods.markAsCompleted = function () {
  this.status = 'completed';
  this.completedDate = new Date();
  this.maturityPaidDate = new Date();
  return this.save();
};

// Instance method to pause kitty
userKittySchema.methods.pauseKitty = function (reason) {
  if (this.status !== 'active') {
    throw new Error('Only active kitties can be paused');
  }
  this.status = 'paused';
  this.pausedDate = new Date();
  if (reason) this.cancellationReason = reason;
  return this.save();
};

// Instance method to resume kitty
userKittySchema.methods.resumeKitty = function () {
  if (this.status !== 'paused') {
    throw new Error('Only paused kitties can be resumed');
  }
  this.status = 'active';
  this.pausedDate = null;
  return this.save();
};

// Instance method to cancel kitty
userKittySchema.methods.cancelKitty = function (reason) {
  if (this.status === 'completed') {
    throw new Error('Completed kitties cannot be cancelled');
  }
  this.status = 'cancelled';
  this.cancelledDate = new Date();
  if (reason) this.cancellationReason = reason;
  return this.save();
};

module.exports = mongoose.model('UserKitty', userKittySchema);
