const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  sku: { type: DataTypes.STRING, allowNull: true, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  categoryId: { type: DataTypes.INTEGER, allowNull: true },
  subcategoryId: { type: DataTypes.INTEGER, allowNull: true },
  priceRuleId: { type: DataTypes.INTEGER, allowNull: true },
  basePrice: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  makingCharge: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  gst: { type: DataTypes.DECIMAL(5, 2), defaultValue: 3.00 },
  finalPrice: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  weight: { type: DataTypes.DECIMAL(10, 3), defaultValue: 0.000 },
  purity: { type: DataTypes.STRING, allowNull: true },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  isPriceFixed: { type: DataTypes.BOOLEAN, defaultValue: false },
  fixedPrice: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  gender: { type: DataTypes.ENUM('men', 'women', 'unisex', 'kids'), defaultValue: 'unisex' },
  images: { type: DataTypes.JSON, defaultValue: [] },
  specifications: { type: DataTypes.JSON, defaultValue: {} },
  tags: { type: DataTypes.JSON, defaultValue: [] },
  metalIds: { type: DataTypes.JSON, defaultValue: [] },
  collectionIds: { type: DataTypes.JSON, defaultValue: [] }
}, {
  tableName: 'products',
  timestamps: true,
  getterMethods: {
    _id() { return this.id; }
  }
});

Product.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  values._id = values.id;
  return values;
};

module.exports = Product;
