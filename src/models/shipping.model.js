const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Shipping = sequelize.define('Shipping', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  orderId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: false },
  trackingNumber: { type: DataTypes.STRING, allowNull: true },
  courierService: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM('Processing', 'Shipped', 'Delivered'), defaultValue: 'Processing' }
}, {
  tableName: 'shippings',
  timestamps: true,
  getterMethods: { _id() { return this.id; } }
});
Shipping.prototype.toJSON = function() { const v = Object.assign({}, this.get()); v._id = v.id; return v; };
module.exports = Shipping;