// models/index.js

const Admin = require('./admin.model');
const User = require('./user.model');
const Product = require('./product.model');
const Festival = require('./festival.model');
const Relation = require('./relation.model');
const Category = require('./category.model');
const PromoCode = require('./promoCode.model');
const SubCategory = require('./subCategory.model');

module.exports = {
  Admin,
  User,
  Product,
  Festival,
  Relation,
  Category,
  PromoCode,
  SubCategory,
};
