const mongoose = require('mongoose');

const suspiciousActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ip: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    activityType: {
        type: String,
        enum: ['NEW_DEVICE', 'NEW_LOCATION', 'MULTIPLE_FAILED_OTP', 'BRUTE_FORCE_ATTEMPT'],
        default: 'NEW_DEVICE'
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
    },
    details: {
        type: String
    },
    isResolved: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

suspiciousActivitySchema.index({ userId: 1 });
suspiciousActivitySchema.index({ activityType: 1 });
suspiciousActivitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('SuspiciousActivity', suspiciousActivitySchema);
