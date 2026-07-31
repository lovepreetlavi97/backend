const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PriceFilter = sequelize.define('PriceFilter', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  label: { type: DataTypes.STRING, allowNull: false },
  minPrice: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  maxPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'price_filters',
  timestamps: true,
  getterMethods: { _id() { return this.id; } }
});
PriceFilter.prototype.toJSON = function() { const v = Object.assign({}, this.get()); v._id = v.id; return v; };
module.exports = PriceFilter;