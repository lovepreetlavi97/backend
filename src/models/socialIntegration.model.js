const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SocialIntegration = sequelize.define('SocialIntegration', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  platform: { type: DataTypes.ENUM('facebook', 'instagram', 'twitter', 'linkedin', 'youtube'), allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  settings: { type: DataTypes.JSON, defaultValue: {} },
  features: { type: DataTypes.JSON, defaultValue: {} },
  stats: { type: DataTypes.JSON, defaultValue: {} },
  isDeleted: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'social_integrations',
  timestamps: true,
  getterMethods: { _id() { return this.id; } }
});
SocialIntegration.prototype.toJSON = function() { const v = Object.assign({}, this.get()); v._id = v.id; return v; };
module.exports = SocialIntegration;