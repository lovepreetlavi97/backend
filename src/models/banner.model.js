const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Banner = sequelize.define('Banner', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: true },
  subtitle: { type: DataTypes.STRING, allowNull: true },
  image: { type: DataTypes.STRING, allowNull: false },
  mobileImage: { type: DataTypes.STRING, allowNull: true },
  link: { type: DataTypes.STRING, allowNull: true },
  type: { type: DataTypes.ENUM('hero', 'bespoke', 'kitty', 'festival', 'offer', 'promotional'), defaultValue: 'hero' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  order: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
  tableName: 'banners',
  timestamps: true,
  getterMethods: {
    _id() { return this.id; }
  }
});

Banner.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  values._id = values.id;
  return values;
};

module.exports = Banner;
