const { sequelize } = require('../config/database');

const User = require('./user.model');
const Admin = require('./admin.model');
const Session = require('./session.model');
const Metal = require('./metal.model');
const Category = require('./category.model');
const SubCategory = require('./subCategory.model');
const PriceRule = require('./priceRule.model');
const CuratedCollection = require('./curatedCollection.model');
const Product = require('./product.model');
const Banner = require('./banner.model');
const Cart = require('./cart.model');
const Wishlist = require('./wishlist.model');
const Order = require('./order.model');
const KittyPlan = require('./kittyPlan.model');
const UserKitty = require('./userKitty.model');
const PromoCode = require('./promoCode.model');
const Review = require('./review.model');
const Blog = require('./blog.model');
const Contact = require('./contact.model');
const DesignRequest = require('./designRequest.model');
const Festival = require('./festival.model');
const Gift = require('./gift.model');
const Grievance = require('./grievance.model');
const InstagramVideo = require('./InstagramVideo');
const Notification = require('./notification.model');
const PriceFilter = require('./priceFilter.model');
const Relation = require('./relation.model');
const ReturnRequest = require('./returnRequest.model');
const Shipping = require('./shipping.model');
const SiteSettings = require('./siteSettings.model');
const SocialIntegration = require('./socialIntegration.model');
const SuspiciousActivity = require('./suspiciousActivity.model');
const Transaction = require('./transaction.model');

// Define Relationships (Associations)
User.hasMany(Session, { foreignKey: 'userId', onDelete: 'CASCADE' });
Session.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Order, { foreignKey: 'userId', onDelete: 'RESTRICT' });
Order.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Cart, { foreignKey: 'userId', onDelete: 'CASCADE' });
Cart.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(Wishlist, { foreignKey: 'userId', onDelete: 'CASCADE' });
Wishlist.belongsTo(User, { foreignKey: 'userId' });

Category.hasMany(SubCategory, { foreignKey: 'categoryId', onDelete: 'SET NULL' });
SubCategory.belongsTo(Category, { foreignKey: 'categoryId' });

Category.hasMany(Product, { foreignKey: 'categoryId', onDelete: 'SET NULL' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });

SubCategory.hasMany(Product, { foreignKey: 'subcategoryId', onDelete: 'SET NULL' });
Product.belongsTo(SubCategory, { foreignKey: 'subcategoryId' });

PriceRule.hasMany(Product, { foreignKey: 'priceRuleId', onDelete: 'SET NULL' });
Product.belongsTo(PriceRule, { foreignKey: 'priceRuleId' });

User.hasMany(UserKitty, { foreignKey: 'userId', onDelete: 'RESTRICT' });
UserKitty.belongsTo(User, { foreignKey: 'userId' });

KittyPlan.hasMany(UserKitty, { foreignKey: 'planId', onDelete: 'RESTRICT' });
UserKitty.belongsTo(KittyPlan, { foreignKey: 'planId' });

User.hasMany(Review, { foreignKey: 'userId', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'userId' });

Product.hasMany(Review, { foreignKey: 'productId', onDelete: 'CASCADE' });
Review.belongsTo(Product, { foreignKey: 'productId' });

User.hasMany(DesignRequest, { foreignKey: 'userId', onDelete: 'CASCADE' });
DesignRequest.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Notification, { foreignKey: 'userId', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId' });

Order.hasOne(Shipping, { foreignKey: 'orderId', onDelete: 'CASCADE' });
Shipping.belongsTo(Order, { foreignKey: 'orderId' });

Order.hasMany(Transaction, { foreignKey: 'orderId', onDelete: 'CASCADE' });
Transaction.belongsTo(Order, { foreignKey: 'orderId' });

module.exports = {
  sequelize,
  User,
  Admin,
  Session,
  Metal,
  Category,
  SubCategory,
  PriceRule,
  CuratedCollection,
  Product,
  Banner,
  Cart,
  Wishlist,
  Order,
  KittyPlan,
  UserKitty,
  PromoCode,
  Review,
  Blog,
  Contact,
  DesignRequest,
  Festival,
  Gift,
  Grievance,
  InstagramVideo,
  Notification,
  PriceFilter,
  Relation,
  ReturnRequest,
  Shipping,
  SiteSettings,
  SocialIntegration,
  SuspiciousActivity,
  Transaction
};
