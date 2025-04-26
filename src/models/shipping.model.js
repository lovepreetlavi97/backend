const mongoose = require('mongoose');
const ShippingSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  address: { type: String, required: true },
  trackingNumber: { type: String },
  courierService: { type: String },
  status: { type: String, enum: ['Processing', 'Shipped', 'Delivered'], default: 'Processing' },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Shipping', ShippingSchema);
