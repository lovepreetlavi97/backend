const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    index: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false, // Don't return password by default in queries
  },
  countryCode: {
    type: String,
    required: [true, 'Country code is required'],
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'superadmin'],
    default: 'user',
  },
  token: {
    type: String,
    default: null,
    select: false, // Don't return token by default
  },
  otp: {
    type: String,
    default: null,
    select: false, // Don't return OTP by default
  },
  otpExpiry: { 
    type: Date, 
    default: null,
    select: false,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  profileImage: {
    type: String,
    default: null,
  },
  shippingAddresses: [{
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
    isDefault: {
      type: Boolean,
      default: false,
    },
    contactPhone: {
      type: String,
      required: true,
    },
    contactName: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      enum: ['Home', 'Work', 'Other'],
      default: 'Home',
    },
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active',
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  deviceInfo: {
    deviceId: String,
    deviceType: {
      type: String,
      enum: ['ios', 'android', 'web', 'other'],
      default: 'web',
    },
    deviceToken: String,
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      default: true,
    },
    pushNotifications: {
      type: Boolean,
      default: true,
    },
    marketingEmails: {
      type: Boolean,
      default: true,
    },
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
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer not to say'],
  },
  isDeleted: {
    type: Boolean,
    default: false,
    select: false,
  },
}, { timestamps: true });

// Index for queries
userSchema.index({ email: 1, phoneNumber: 1 });
userSchema.index({ status: 1 });
userSchema.index({ isDeleted: 1 });

// Set all address isDefault to false when a new default is set
userSchema.pre('save', function(next) {
  if (this.isModified('shippingAddresses')) {
    const defaultAddress = this.shippingAddresses.find(addr => addr.isDefault);
    if (defaultAddress) {
      this.shippingAddresses.forEach(addr => {
        if (addr._id.toString() !== defaultAddress._id.toString()) {
          addr.isDefault = false;
        }
      });
    } else if (this.shippingAddresses.length > 0) {
      // If no default address, set the first one as default
      this.shippingAddresses[0].isDefault = true;
    }
  }
  next();
});

// Make sure deleted users aren't returned in queries
userSchema.pre(/^find/, function(next) {
  this.find({ isDeleted: { $ne: true } });
  next();
});

module.exports = mongoose.model('User', userSchema);
