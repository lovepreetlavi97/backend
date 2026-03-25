const mongoose = require('mongoose');
const slugify = require('slugify');

const DEFAULT_IMAGE_URL = "https://via.placeholder.com/800x400?text=Banner+Image";

const bannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    trim: true,
    default: ""
  },
  buttonText: {
    type: String,
    trim: true,
    default: "Shop Now"
  },
  type: {
    type: String,
    required: true,
    enum: ['home', 'category', 'popup', 'slider', 'gift'],
    default: 'home'
  },
  imageUrl: {
    type: String,
    default: DEFAULT_IMAGE_URL
  },
  link: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'scheduled'],
    default: 'active'
  },
  position: {
    type: Number,
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

/** Pre-save hook: generate slug from title */
bannerSchema.pre('save', function (next) {
  if (this.isModified('title') || this.isNew) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }

  // Auto update status based on dates
  const now = new Date();
  if (now < this.startDate) {
    this.status = 'scheduled';
  } else if (now >= this.startDate && now <= this.endDate) {
    this.status = 'active';
  } else {
    this.status = 'inactive';
  }

  next();
});

/** Virtual field to check if banner is expired */
bannerSchema.virtual('isExpired').get(function () {
  return Date.now() > this.endDate;
});

/** Indexes for optimized querying */
bannerSchema.index({ title: 1 });
bannerSchema.index({ slug: 1 });
bannerSchema.index({ type: 1 });
bannerSchema.index({ status: 1 });
bannerSchema.index({ position: 1 });
bannerSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
