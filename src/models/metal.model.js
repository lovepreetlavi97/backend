const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Metal = sequelize.define('Metal', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  purity: { type: DataTypes.STRING, allowNull: true },
  rate: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0.00 },
  unit: { type: DataTypes.STRING, defaultValue: 'gram' },
  description: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'metals',
  timestamps: true,
  getterMethods: {
    _id() { return this.id; }
  }
});

Metal.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  values._id = values.id;
  return values;
};

module.exports = Metal;
