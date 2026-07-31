const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DesignRequest = sequelize.define('DesignRequest', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  metalType: { type: DataTypes.STRING, allowNull: true },
  estimatedBudget: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: false },
  referenceImages: { type: DataTypes.JSON, defaultValue: [] },
  status: { type: DataTypes.ENUM('pending', 'in_review', 'approved', 'rejected', 'completed'), defaultValue: 'pending' }
}, {
  tableName: 'design_requests',
  timestamps: true,
  getterMethods: { _id() { return this.id; } }
});
DesignRequest.prototype.toJSON = function() { const v = Object.assign({}, this.get()); v._id = v.id; return v; };
module.exports = DesignRequest;