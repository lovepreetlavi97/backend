// models/index.js

const Admin = require('./admin.model');
const User = require('./user.model');
const Product = require('./product.model');
const Festival = require('./festival.model');
const Relation = require('./relation.model');
const Category = require('./category.model');

module.exports = {
  Admin,
  User,
  Product,
  Festival,
  Relation,
  Category,
};
