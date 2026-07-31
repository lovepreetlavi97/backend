const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const InstagramVideo = sequelize.define('InstagramVideo', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: true },
  videoUrl: { type: DataTypes.STRING, allowNull: false },
  thumbnailUrl: { type: DataTypes.STRING, allowNull: true },
  instagramUrl: { type: DataTypes.STRING, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  order: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
  tableName: 'instagram_videos',
  timestamps: true,
  getterMethods: { _id() { return this.id; } }
});
InstagramVideo.prototype.toJSON = function() { const v = Object.assign({}, this.get()); v._id = v.id; return v; };
module.exports = InstagramVideo;