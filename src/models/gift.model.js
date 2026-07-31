const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Gift = sequelize.define('Gift', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  image: { type: DataTypes.STRING, defaultValue: '' },
  priceRange: { type: DataTypes.STRING, allowNull: true },
  targetAudience: { type: DataTypes.STRING, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'gifts',
  timestamps: true,
  getterMethods: { _id() { return this.id; } }
});
Gift.prototype.toJSON = function() { const v = Object.assign({}, this.get()); v._id = v.id; return v; };
module.exports = Gift;