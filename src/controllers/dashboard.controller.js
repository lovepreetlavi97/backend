const mongoose = require('mongoose');
const User = require('../models/user.model');
const Category = require('../models/category.model');
const Subcategory = require('../models/subCategory.model');
const Relation = require('../models/relation.model');
const Product = require('../models/product.model');
const Festival = require('../models/festival.model');
const Cart = require('../models/cart.model');
const Contact = require('../models/contact.model');
const Wishlist = require('../models/wishlist.model');
const Order = require('../models/order.model');
const Transaction = require('../models/transaction.model');

/**
 * GET /admin/dashboard
 * Returns counts for admin dashboard widgets
 */
const getDashboardCounts = async (req, res) => {
  try {
    const usersCountPromise = User.countDocuments({ role: 'user', isDeleted: { $ne: true } });

    const categoriesCountPromise = Category.countDocuments({ isDeleted: { $ne: true } });

    const subcategoriesCountPromise = Subcategory.countDocuments({ isDeleted: { $ne: true } });

    const relationsCountPromise = Relation.countDocuments({ isDeleted: { $ne: true } });

    const productsCountPromise = Product.countDocuments({ isDeleted: { $ne: true } });

    const festivalsCountPromise = Festival.countDocuments({ isDeleted: { $ne: true } });

    const ordersCountPromise = Order.countDocuments({});

    const refundsCountPromise = Order.countDocuments({
      $or: [
        { 'refundDetails.refundStatus': 'Completed' },
        { status: 'Refunded' },
        { paymentStatus: 'Refunded' }
      ]
    });

    const revenuePromise = Transaction.aggregate([
      { $match: { status: 'Completed', amount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const cartsCountPromise = Cart.countDocuments({ 'items.0': { $exists: true } });

    const contactsCountPromise = Contact.countDocuments();

    const wishlistItemsPromise = Wishlist.aggregate([
      { $project: { count: { $size: { $ifNull: ['$products', []] } } } },
      { $group: { _id: null, total: { $sum: '$count' } } }
    ]);

    const [
      usersCount,
      categoriesCount,
      subcategoriesCount,
      relationsCount,
      productsCount,
      festivalsCount,
      ordersCount,
      refundsCount,
      revenueAgg,
      cartsCount,
      contactsCount,
      wishlistAgg
    ] = await Promise.all([
      usersCountPromise,
      categoriesCountPromise,
      subcategoriesCountPromise,
      relationsCountPromise,
      productsCountPromise,
      festivalsCountPromise,
      ordersCountPromise,
      refundsCountPromise,
      revenuePromise,
      cartsCountPromise,
      contactsCountPromise,
      wishlistItemsPromise
    ]);

    const revenue = (revenueAgg && revenueAgg.length > 0) ? revenueAgg[0].total : 0;
    const wishlistItems = (wishlistAgg && wishlistAgg.length > 0) ? wishlistAgg[0].total : 0;

    return res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: {
        users: usersCount,
        categories: categoriesCount,
        subcategories: subcategoriesCount,
        relations: relationsCount,
        products: productsCount,
        festivals: festivalsCount,
        orders: ordersCount,
        refunds: refundsCount,
        revenue,
        carts: cartsCount,
        contactQueries: contactsCount,
        wishlistItems
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return res.status(500).json({ status: 'error', statusCode: 500, message: 'Server error', error: error.message });
  }
};

/**
 * GET /admin/dashboard/performance
 */
const getDashboardPerformance = async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1, 0, 0, 0, 0);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    // Aggregations grouped by month number 1-12
    const [ordersByMonth, usersByMonth, revenueByMonth] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear }, isDeleted: { $ne: true } } },
        { $project: { m: { $month: '$createdAt' } } },
        { $group: { _id: '$m', count: { $sum: 1 } } }
      ]),
      User.aggregate([
        { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear }, role: 'user', isDeleted: { $ne: true } } },
        { $project: { m: { $month: '$createdAt' } } },
        { $group: { _id: '$m', count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { createdAt: { $gte: startOfYear, $lte: endOfYear }, status: 'Completed', amount: { $gt: 0 } } },
        { $project: { m: { $month: '$createdAt' }, amount: 1 } },
        { $group: { _id: '$m', total: { $sum: '$amount' } } }
      ])
    ]);

    // Helper maps for quick lookup
    const ordersMap = new Map(ordersByMonth.map(o => [o._id, o.count]));
    const usersMap = new Map(usersByMonth.map(u => [u._id, u.count]));
    const revenueMap = new Map(revenueByMonth.map(r => [r._id, r.total]));

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const currentMonthIndex = now.getMonth(); // 0-based
    const months = [];
    for (let i = 0; i < 12; i++) {
      const monthNum = i + 1; // 1..12
      let orders = ordersMap.get(monthNum) || 0;
      let users = usersMap.get(monthNum) || 0;
      let revenue = revenueMap.get(monthNum) || 0;
      // Zero out future months strictly after current month
      if (i > currentMonthIndex) {
        orders = 0; users = 0; revenue = 0;
      }
      months.push({ month: monthNames[i], orders, users, revenue });
    }

    return res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: {
        year,
        months
      }
    });
  } catch (error) {
    console.error('Dashboard performance error:', error);
    return res.status(500).json({ status: 'error', statusCode: 500, message: 'Server error', error: error.message });
  }
};

module.exports = { getDashboardCounts, getDashboardPerformance };