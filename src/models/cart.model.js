const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cart = sequelize.define('Cart', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  products: { type: DataTypes.JSON, defaultValue: [] }
}, {
  tableName: 'carts',
  timestamps: true,
  getterMethods: {
    _id() { return this.id; }
  }
});

Cart.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  values._id = values.id;
  return values;
};

module.exports = Cart;
