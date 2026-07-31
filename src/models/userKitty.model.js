const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserKitty = sequelize.define('UserKitty', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  planId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  startDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  endDate: { type: DataTypes.DATE, allowNull: false },
  nextPaymentDate: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.ENUM('active', 'completed', 'paused', 'cancelled', 'pending'), defaultValue: 'pending' },
  monthlyAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  totalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  maturityAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  totalPaid: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  remainingAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  payments: { type: DataTypes.JSON, defaultValue: [] },
  pausedDate: { type: DataTypes.DATE, allowNull: true },
  cancelledDate: { type: DataTypes.DATE, allowNull: true },
  cancellationReason: { type: DataTypes.STRING(500), allowNull: true },
  completedDate: { type: DataTypes.DATE, allowNull: true },
  maturityPaidDate: { type: DataTypes.DATE, allowNull: true },
  autoPaymentEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  notes: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'user_kitties',
  timestamps: true,
  getterMethods: {
    _id() { return this.id; }
  }
});

UserKitty.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  values._id = values.id;
  return values;
};

module.exports = UserKitty;
