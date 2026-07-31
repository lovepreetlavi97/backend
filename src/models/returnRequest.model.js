const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReturnRequest = sequelize.define('ReturnRequest', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  products: { type: DataTypes.JSON, defaultValue: [] },
  returnReason: { type: DataTypes.TEXT, allowNull: false },
  returnStatus: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'), defaultValue: 'pending' },
  refundAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  refundStatus: { type: DataTypes.ENUM('pending', 'processed', 'failed'), defaultValue: 'pending' },
  refundMethod: { type: DataTypes.ENUM('original_payment', 'store_credit', 'bank_transfer'), defaultValue: 'original_payment' },
  trackingNumber: { type: DataTypes.STRING, allowNull: true },
  adminNotes: { type: DataTypes.TEXT, allowNull: true },
  attachments: { type: DataTypes.JSON, defaultValue: [] }
}, {
  tableName: 'return_requests',
  timestamps: true,
  getterMethods: { _id() { return this.id; } }
});
ReturnRequest.prototype.toJSON = function() { const v = Object.assign({}, this.get()); v._id = v.id; return v; };
module.exports = ReturnRequest;