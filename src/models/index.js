// models/index.js

const Admin = require('./admin.model');
const User = require('./user.model');
const Product = require('./product.model');
const Festival = require('./festival.model');
const Relation = require('./relation.model');
const Category = require('./category.model');
const PromoCode = require('./promoCode.model');
const SubCategory = require('./subCategory.model');
const Cart = require('./cart.model');
const Wishlist = require('./wishlist.model');
const Order = require('./order.model');
const Review = require('./review.model');
const Transaction = require('./transaction.model');
const Shipping = require('./shipping.model');
const Blog = require('./blog.model');
const Contact = require('./contact.model');
module.exports = {
  Cart,
  Wishlist,
  Admin,
  User,
  Product,
  Festival,
  Relation,
  Category,
  PromoCode,
  SubCategory,
  Order,
  Review,
  Transaction,
  Shipping,
  Blog,
  Contact,

};
