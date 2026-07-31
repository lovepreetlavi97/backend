const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Review = sequelize.define('Review', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  productId: { type: DataTypes.INTEGER, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false },
  reviewText: { type: DataTypes.TEXT, allowNull: true },
  images: { type: DataTypes.JSON, defaultValue: [] },
  helpfulCount: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
  tableName: 'reviews',
  timestamps: true,
  getterMethods: {
    _id() { return this.id; }
  }
});

Review.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  values._id = values.id;
  return values;
};

module.exports = Review;
