const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SuspiciousActivity = sequelize.define('SuspiciousActivity', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  ip: { type: DataTypes.STRING, allowNull: false },
  userAgent: { type: DataTypes.TEXT, allowNull: false },
  activityType: { type: DataTypes.ENUM('NEW_DEVICE', 'NEW_LOCATION', 'MULTIPLE_FAILED_OTP', 'BRUTE_FORCE_ATTEMPT'), defaultValue: 'NEW_DEVICE' },
  severity: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'low' },
  details: { type: DataTypes.TEXT, allowNull: true },
  isResolved: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'suspicious_activities',
  timestamps: true,
  getterMethods: { _id() { return this.id; } }
});
SuspiciousActivity.prototype.toJSON = function() { const v = Object.assign({}, this.get()); v._id = v.id; return v; };
module.exports = SuspiciousActivity;