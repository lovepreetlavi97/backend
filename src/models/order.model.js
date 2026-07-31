const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderNumber: { type: DataTypes.STRING, allowNull: true, unique: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  products: { type: DataTypes.JSON, defaultValue: [] },
  totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.00 },
  discountAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  finalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.00 },
  paymentStatus: { type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'), defaultValue: 'pending' },
  paymentMethod: { type: DataTypes.STRING, defaultValue: 'razorpay' },
  razorpayOrderId: { type: DataTypes.STRING, allowNull: true },
  razorpayPaymentId: { type: DataTypes.STRING, allowNull: true },
  razorpaySignature: { type: DataTypes.STRING, allowNull: true },
  orderStatus: { type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'), defaultValue: 'pending' },
  shippingAddress: { type: DataTypes.JSON, allowNull: true },
  billingAddress: { type: DataTypes.JSON, allowNull: true },
  promoCode: { type: DataTypes.STRING, allowNull: true },
  promoCodeId: { type: DataTypes.INTEGER, allowNull: true },
  idempotencyKey: { type: DataTypes.STRING, allowNull: true, unique: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  cancelledAt: { type: DataTypes.DATE, allowNull: true },
  cancellationReason: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'orders',
  timestamps: true,
  getterMethods: {
    _id() { return this.id; }
  }
});

Order.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  values._id = values.id;
  return values;
};

module.exports = Order;
