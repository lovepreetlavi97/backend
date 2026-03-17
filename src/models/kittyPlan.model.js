const mongoose = require('mongoose');

const kittyPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
    maxlength: [100, 'Plan name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Plan description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 month'],
    max: [60, 'Duration cannot exceed 60 months']
  },
  monthlyAmount: {
    type: Number,
    required: [true, 'Monthly amount is required'],
    min: [100, 'Monthly amount must be at least 100'],
    max: [1000000, 'Monthly amount cannot exceed 10,00,000']
  },
  totalAmount: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [100, 'Total amount must be at least 100']
  },
  maturityAmount: {
    type: Number,
    required: [true, 'Maturity amount is required'],
    min: [100, 'Maturity amount must be at least 100']
  },
  benefits: [{
    type: String,
    trim: true,
    maxlength: [200, 'Benefit cannot exceed 200 characters']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  maxParticipants: {
    type: Number,
    min: [1, 'Max participants must be at least 1'],
    max: [10000, 'Max participants cannot exceed 10000']
  },
  currentParticipants: {
    type: Number,
    default: 0,
    min: [0, 'Current participants cannot be negative']
  },
  category: {
    type: String,
    enum: ['gold', 'silver', 'diamond', 'platinum'],
    required: [true, 'Category is required']
  },
  image: {
    type: String,
    trim: true
  },
  terms: [{
    type: String,
    trim: true,
    maxlength: [500, 'Term cannot exceed 500 characters']
  }],
  interestRate: {
    type: Number,
    min: [0, 'Interest rate cannot be negative'],
    max: [100, 'Interest rate cannot exceed 100%'],
    default: 0
  },
  processingFee: {
    type: Number,
    min: [0, 'Processing fee cannot be negative'],
    max: [10000, 'Processing fee cannot exceed 10,000'],
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for ROI calculation
kittyPlanSchema.virtual('roi').get(function() {
  if (this.totalAmount === 0) return 0;
  return ((this.maturityAmount - this.totalAmount) / this.totalAmount * 100).toFixed(2);
});

// Virtual for available slots
kittyPlanSchema.virtual('availableSlots').get(function() {
  if (!this.maxParticipants) return null;
  return Math.max(0, this.maxParticipants - this.currentParticipants);
});

// Indexes for better performance
kittyPlanSchema.index({ category: 1, isActive: 1 });
kittyPlanSchema.index({ monthlyAmount: 1 });
kittyPlanSchema.index({ duration: 1 });
kittyPlanSchema.index({ createdAt: -1 });

// Pre-save middleware to validate currentParticipants
kittyPlanSchema.pre('save', function(next) {
  if (this.maxParticipants && this.currentParticipants > this.maxParticipants) {
    this.currentParticipants = this.maxParticipants;
  }
  next();
});

// Static method to find active plans
kittyPlanSchema.statics.findActivePlans = function() {
  return this.find({ isActive: true })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email');
};

// Static method to find plans by category
kittyPlanSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true })
    .sort({ createdAt: -1 })
    .populate('createdBy', 'name email');
};

// Instance method to check if plan is available for enrollment
kittyPlanSchema.methods.isAvailableForEnrollment = function() {
  return this.isActive && 
         (!this.maxParticipants || this.currentParticipants < this.maxParticipants);
};

// Instance method to increment participants
kittyPlanSchema.methods.incrementParticipants = function() {
  if (this.maxParticipants && this.currentParticipants >= this.maxParticipants) {
    throw new Error('Plan has reached maximum participants');
  }
  this.currentParticipants += 1;
  return this.save();
};

// Instance method to decrement participants
kittyPlanSchema.methods.decrementParticipants = function() {
  if (this.currentParticipants <= 0) {
    throw new Error('Cannot decrement participants below zero');
  }
  this.currentParticipants -= 1;
  return this.save();
};

module.exports = mongoose.model('KittyPlan', kittyPlanSchema);
