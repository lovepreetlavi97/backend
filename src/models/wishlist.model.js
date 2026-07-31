const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Wishlist = sequelize.define('Wishlist', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  products: { type: DataTypes.JSON, defaultValue: [] }
}, {
  tableName: 'wishlists',
  timestamps: true,
  getterMethods: {
    _id() { return this.id; }
  }
});

Wishlist.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  values._id = values.id;
  return values;
};

module.exports = Wishlist;
