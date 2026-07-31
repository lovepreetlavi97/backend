const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CuratedCollection = sequelize.define('CuratedCollection', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  image: { type: DataTypes.STRING, defaultValue: '' },
  bannerImage: { type: DataTypes.STRING, defaultValue: '' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'curated_collections',
  timestamps: true,
  getterMethods: {
    _id() { return this.id; }
  }
});

CuratedCollection.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  values._id = values.id;
  return values;
};

module.exports = CuratedCollection;
