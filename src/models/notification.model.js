const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  userName: { type: String, required: false },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: false },
  type: { 
    type: String, 
    required: true, 
    enum: ['NEW_ORDER', 'ORDER_CANCELLED', 'ORDER_RETURNED', 'ORDER_REFUNDED'] 
  },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false, index: true },
  metadata: { type: Object },
}, { timestamps: true });

notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
