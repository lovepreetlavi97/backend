const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PriceRule = sequelize.define('PriceRule', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('making_charge', 'discount', 'markup', 'fixed', 'percentage'), defaultValue: 'making_charge' },
  value: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.00 },
  isPercentage: { type: DataTypes.BOOLEAN, defaultValue: false },
  description: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'price_rules',
  timestamps: true,
  getterMethods: {
    _id() { return this.id; }
  }
});

PriceRule.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  values._id = values.id;
  return values;
};

module.exports = PriceRule;
