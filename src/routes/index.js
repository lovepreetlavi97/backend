const express = require('express');
const welcomeRoute = require('./welcome.route');
const adminRoute = require('./admin.route');
const categoryRoute = require('./category.route');
const festivalRoute = require('./festival.route');
const productRoute = require('./product.route');
const relationRoute = require('./relation.route');
const subcategoryRoute = require('./subcategory.route');
const userRoute = require('./user.route');
const promoRoute = require('./promocode.route');
const {adminAuth,userAuth} = require('../middlewares/auth/auth.middleware');
const router = express.Router();

// Register your routes
router.use('/', welcomeRoute);
router.use('/admin', adminRoute);
router.use('/categories', categoryRoute);
router.use('/festivals', festivalRoute);
router.use('/products', productRoute);
router.use('/relations', relationRoute);
router.use('/subcategories', subcategoryRoute);
router.use('/users', userRoute);
router.use('/promocodes',promoRoute);

module.exports = router;
