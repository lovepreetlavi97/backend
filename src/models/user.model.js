const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  countryCode: { type: DataTypes.STRING, allowNull: false, defaultValue: '+91' },
  phoneNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  role: { type: DataTypes.ENUM('user', 'admin', 'superadmin'), defaultValue: 'user' },
  token: { type: DataTypes.TEXT, allowNull: true },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  resetPasswordOtp: { type: DataTypes.STRING, allowNull: true },
  resetPasswordExpires: { type: DataTypes.DATE, allowNull: true },
  twoFactorSecret: { type: DataTypes.STRING, allowNull: true },
  isTwoFactorEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  twoFactorBackupCodes: { type: DataTypes.JSON, defaultValue: [] },
  isBlocked: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: 'users',
  timestamps: true,
  getterMethods: {
    _id() { return this.id; }
  }
});

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  values._id = values.id;
  return values;
};

module.exports = User;
