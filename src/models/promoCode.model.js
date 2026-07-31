const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PromoCode = sequelize.define('PromoCode', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  type: { type: DataTypes.ENUM('percentage', 'fixed'), allowNull: false },
  value: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  minPurchase: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  minOrderValue: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  maxDiscount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  startDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  endDate: { type: DataTypes.DATE, allowNull: false },
  usageLimit: { type: DataTypes.INTEGER, allowNull: false },
  usageCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  usedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  description: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('active', 'inactive', 'expired'), defaultValue: 'active' },
  isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  usedBy: { type: DataTypes.JSON, defaultValue: [] },
  userRestrictions: { type: DataTypes.JSON, defaultValue: [] }
}, {
  tableName: 'promo_codes',
  timestamps: true,
  getterMethods: {
    _id() { return this.id; }
  }
});

PromoCode.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  values._id = values.id;
  return values;
};

module.exports = PromoCode;
