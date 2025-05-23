const express = require('express');
const welcomeRoute = require('./welcome.route');
const adminRoute = require('./admin.route');
const categoryRoute = require('./category.route');
const festivalRoute = require('./festival.route');
const productRoute = require('./product.route');
const relationRoute = require('./relation.route');
const subcategoryRoute = require('./subcategory.route');
// const userRoute = require('./user.route');
const promoRoute = require('./promocode.route');
const cartRoute = require('./cart.route');
const wishlistRoute = require('./wishlist.route');
const orderRoute = require('./order.route');
const reviewRoute = require('./review.route');
const superAdminRoute = require('./superAdmin.route');
const socialIntegrationRoutes = require('./socialIntegration.route');
const priceRuleRoute = require('./priceRule.route');
const bannerRoute = require('./banner.route');
const grievanceRoute = require('./grievance.route');
const router = express.Router();

// Register your routes
router.use('/', welcomeRoute);
router.use('/admin', adminRoute);
router.use('/superadmin', superAdminRoute);
router.use('/categories', categoryRoute);
router.use('/festivals', festivalRoute);
router.use('/products', productRoute);
router.use('/relations', relationRoute);
router.use('/subcategories', subcategoryRoute);
// router.use('/user', userRoute);
router.use('/promocodes', promoRoute);
router.use('/cart', cartRoute);
router.use('/wishlist', wishlistRoute);
router.use('/order', orderRoute);
router.use('/review', reviewRoute);
router.use('/social', socialIntegrationRoutes);
router.use('/prices', priceRuleRoute);
router.use('/banners', bannerRoute);
router.use('/grievances', grievanceRoute);


module.exports = router;
