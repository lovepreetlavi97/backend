const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Festival = sequelize.define('Festival', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  bannerImage: { type: DataTypes.STRING, defaultValue: '' },
  startDate: { type: DataTypes.DATE, allowNull: true },
  endDate: { type: DataTypes.DATE, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  productIds: { type: DataTypes.JSON, defaultValue: [] }
}, {
  tableName: 'festivals',
  timestamps: true,
  getterMethods: { _id() { return this.id; } }
});
Festival.prototype.toJSON = function() { const v = Object.assign({}, this.get()); v._id = v.id; return v; };
module.exports = Festival;