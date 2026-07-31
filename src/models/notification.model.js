const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.STRING, defaultValue: 'info' },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  data: { type: DataTypes.JSON, defaultValue: {} }
}, {
  tableName: 'notifications',
  timestamps: true,
  getterMethods: { _id() { return this.id; } }
});
Notification.prototype.toJSON = function() { const v = Object.assign({}, this.get()); v._id = v.id; return v; };
module.exports = Notification;