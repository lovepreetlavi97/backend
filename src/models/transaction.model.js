const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  orderId: { type: DataTypes.INTEGER, allowNull: false },
  paymentMethod: { type: DataTypes.ENUM('Card', 'PayPal', 'Razorpay', 'Bank Transfer'), allowNull: false },
  transactionId: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  status: { type: DataTypes.ENUM('Pending', 'Completed', 'Failed'), defaultValue: 'Pending' }
}, {
  tableName: 'transactions',
  timestamps: true,
  getterMethods: { _id() { return this.id; } }
});
Transaction.prototype.toJSON = function() { const v = Object.assign({}, this.get()); v._id = v.id; return v; };
module.exports = Transaction;