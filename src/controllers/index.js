const adminController = require('./admin.controller');
const userController = require('./user.controller');
const productController = require('./product.controller');
const festivalController = require('./festival.controller');
const relationController = require('./relation.controller');
const categoryController = require('./category.controller');
const promoCodeController = require('./promoCode.controller');
const cartController = require('./cart.controller');
const wishlistController = require('./wishlist.controller');
const socialIntegrationController = require('./socialIntegration.controller');
const priceRuleController = require('./priceRule.controller');
const grievanceController = require('./grievance.controller');

module.exports = {
  adminController,
  userController,
  productController,
  festivalController,
  relationController,
  categoryController,
  promoCodeController,
  cartController,
  wishlistController,
  socialIntegrationController,
  priceRuleController,
  grievanceController
};
