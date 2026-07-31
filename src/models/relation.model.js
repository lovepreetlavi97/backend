const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Relation = sequelize.define('Relation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: false },
  image: { type: DataTypes.STRING, defaultValue: '' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'relations',
  timestamps: true,
  getterMethods: { _id() { return this.id; } }
});
Relation.prototype.toJSON = function() { const v = Object.assign({}, this.get()); v._id = v.id; return v; };
module.exports = Relation;