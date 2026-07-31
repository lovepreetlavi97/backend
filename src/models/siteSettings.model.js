const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SiteSettings = sequelize.define('SiteSettings', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  key: { type: DataTypes.STRING, defaultValue: 'main', unique: true },
  brand: { type: DataTypes.JSON, defaultValue: { name: 'Guru Jewellers', tagline: '', logoUrl: '' } },
  contact: { type: DataTypes.JSON, defaultValue: { email: '', phone: '', whatsapp: '', address: '', googleMapUrl: '', businessHours: '' } },
  social: { type: DataTypes.JSON, defaultValue: { instagramAccounts: [], instagramHashtag: '#GURUJEWELLERS', facebook: '', youtube: '', twitter: '' } },
  links: { type: DataTypes.JSON, defaultValue: { instagramPageLinks: [], footerLinks: [] } },
  featureBadges: { type: DataTypes.JSON, defaultValue: ['Hallmarked Jewellery', '15-Day Returns', 'Free Delivery', 'Certified Diamonds'] },
  footerAbout: { type: DataTypes.TEXT, defaultValue: '' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'site_settings',
  timestamps: true,
  getterMethods: { _id() { return this.id; } }
});
SiteSettings.prototype.toJSON = function() { const v = Object.assign({}, this.get()); v._id = v.id; return v; };
module.exports = SiteSettings;