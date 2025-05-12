const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    index: true,
  },
  password: {
    type: String,
    required: true,
    minlength: [6, 'Password must be at least 6 characters long'],
    // select: false, // Don't return password by default
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin'],
    default: 'admin',
    index: true,
  },
  token: {
    type: String,
    default: null,
    select: false, // Don't return token by default
  },
  permissions: {
    manageProducts: { type: Boolean, default: false },
    manageCategories: { type: Boolean, default: false },
    manageOrders: { type: Boolean, default: false },
    manageUsers: { type: Boolean, default: false },
    manageAdmins: { type: Boolean, default: false }, // Only for superadmin
    manageSettings: { type: Boolean, default: false },
    viewReports: { type: Boolean, default: false },
    managePromotions: { type: Boolean, default: false },
    manageBlogs: { type: Boolean, default: false },
    manageReviews: { type: Boolean, default: false },
    manageTransactions: { type: Boolean, default: false },
    manageShipping: { type: Boolean, default: false },
  },
  profileImage: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    index: true,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  passwordResetToken: {
    type: String,
    default: null,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    default: null,
    select: false,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  department: {
    type: String,
    trim: true,
    default: 'Operations',
  },
  isDeleted: {
    type: Boolean,
    default: false,
    select: false,
  },
  loginHistory: [{
    ipAddress: String,
    userAgent: String,
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['success', 'failure'], default: 'success' },
  }],
  actionLogs: [{
    action: String, // Description of action
    details: Object, // Additional details
    timestamp: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

// Indexes for efficient queries
adminSchema.index({ email: 1 });
adminSchema.index({ role: 1, status: 1 });
adminSchema.index({ isDeleted: 1 });

// Pre-save hook to automatically set all permissions to true for superadmin
adminSchema.pre('save', function(next) {
  if (this.role === 'superadmin') {
    Object.keys(this.permissions).forEach(permission => {
      this.permissions[permission] = true;
    });
  }
  next();
});

// Make sure deleted admins aren't returned in queries
adminSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

// Method to log admin actions
adminSchema.methods.logAction = async function(action, details = {}) {
  this.actionLogs.push({
    action,
    details,
    timestamp: new Date()
  });
  return this.save();
};

// Method to log login activity
adminSchema.methods.logLogin = async function(ipAddress, userAgent, status = 'success') {
  this.loginHistory.push({
    ipAddress,
    userAgent,
    timestamp: new Date(),
    status
  });
  if (status === 'success') {
    this.lastLoginAt = new Date();
  }
  return this.save();
};

module.exports = mongoose.model('Admin', adminSchema);
