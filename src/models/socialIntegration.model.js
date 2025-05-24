const mongoose = require('mongoose');

const socialIntegrationSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube'],
    lowercase: true
  },
  name: {
    type: String,
    required: true
  },
  enabled: {
    type: Boolean,
    default: false
  },
  settings: {
    pageId: String,
    accessToken: String,
    pageUrl: String,
    accountId: String,
    username: String,
    handle: String,
    apiKey: String
  },
  features: {
    sharing: {
      type: Boolean,
      default: true
    },
    login: {
      type: Boolean,
      default: false
    },
    feed: {
      type: Boolean,
      default: true
    },
    pixel: {
      type: Boolean,
      default: false
    },
    shop: {
      type: Boolean,
      default: false
    }
  },
  stats: {
    followers: {
      type: Number,
      default: 0
    },
    engagement: {
      type: Number,
      default: 0
    },
    lastSync: {
      type: Date,
      default: Date.now
    }
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SocialIntegration', socialIntegrationSchema); 