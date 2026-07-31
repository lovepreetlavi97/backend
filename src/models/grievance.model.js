const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Grievance = sequelize.define('Grievance', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  ticketNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  subject: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'), defaultValue: 'open' },
  priority: { type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' },
  resolutionNotes: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'grievances',
  timestamps: true,
  getterMethods: { _id() { return this.id; } }
});
Grievance.prototype.toJSON = function() { const v = Object.assign({}, this.get()); v._id = v.id; return v; };
module.exports = Grievance;