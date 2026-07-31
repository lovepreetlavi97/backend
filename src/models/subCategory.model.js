const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubCategory = sequelize.define('SubCategory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  categoryId: { type: DataTypes.INTEGER, allowNull: true },
  category: { type: DataTypes.INTEGER, allowNull: true },
  parentId: { type: DataTypes.INTEGER, allowNull: true },
  image: { type: DataTypes.STRING, defaultValue: '' },
  description: { type: DataTypes.TEXT, allowNull: true },
  metalIds: { type: DataTypes.JSON, defaultValue: [] },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  order: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
  tableName: 'sub_categories',
  timestamps: true,
  getterMethods: {
    _id() { return this.id; }
  }
});

SubCategory.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  values._id = values.id;
  return values;
};

module.exports = SubCategory;
