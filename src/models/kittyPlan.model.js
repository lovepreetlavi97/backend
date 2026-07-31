const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const KittyPlan = sequelize.define('KittyPlan', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  monthlyAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  durationInMonths: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 12 },
  bonusPercentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0.00 },
  bonusAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  totalPayable: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  maturityAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  description: { type: DataTypes.TEXT, allowNull: true },
  features: { type: DataTypes.JSON, defaultValue: [] },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'kitty_plans',
  timestamps: true,
  getterMethods: {
    _id() { return this.id; }
  }
});

KittyPlan.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  values._id = values.id;
  return values;
};

module.exports = KittyPlan;
