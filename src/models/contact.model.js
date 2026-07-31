const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contact = sequelize.define('Contact', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: true },
  subject: { type: DataTypes.STRING, allowNull: true },
  message: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'replied', 'archived'), defaultValue: 'pending' }
}, {
  tableName: 'contacts',
  timestamps: true,
  getterMethods: { _id() { return this.id; } }
});
Contact.prototype.toJSON = function() { const v = Object.assign({}, this.get()); v._id = v.id; return v; };
module.exports = Contact;