const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Blog = sequelize.define('Blog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  slug: { type: DataTypes.STRING, allowNull: false, unique: true },
  content: { type: DataTypes.TEXT, allowNull: false },
  image: { type: DataTypes.STRING, defaultValue: '' },
  author: { type: DataTypes.STRING, defaultValue: 'Admin' },
  tags: { type: DataTypes.JSON, defaultValue: [] },
  isPublished: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'blogs',
  timestamps: true,
  getterMethods: { _id() { return this.id; } }
});
Blog.prototype.toJSON = function() { const v = Object.assign({}, this.get()); v._id = v.id; return v; };
module.exports = Blog;