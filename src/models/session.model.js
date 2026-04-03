const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ip: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    refreshToken: {
        type: String,
        required: true
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Indexing for performance and automatic expiration if needed
sessionSchema.index({ userId: 1 });
sessionSchema.index({ refreshToken: 1 });

module.exports = mongoose.model('UserSession', sessionSchema);
