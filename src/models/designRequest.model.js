const mongoose = require('mongoose');

const designRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    contact: {
        type: String, // Can be phone or email
        required: [true, 'Contact information is required'],
        trim: true
    },
    imageUrl: {
        type: String,
        required: [true, 'Design image is required']
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'contacted', 'resolved', 'rejected'],
        default: 'pending'
    },
    adminNotes: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// Indexing for admin searches
designRequestSchema.index({ status: 1 });
designRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('DesignRequest', designRequestSchema);
