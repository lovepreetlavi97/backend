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
router.use('/categories',adminAuth, categoryRoute);
router.use('/festivals',adminAuth, festivalRoute);
router.use('/products',adminAuth, productRoute);
router.use('/relations',adminAuth, relationRoute);
router.use('/subcategories', subcategoryRoute);
router.use('/users',adminAuth, userRoute);
router.use('/promocodes',adminAuth, promoRoute);

module.exports = router;
