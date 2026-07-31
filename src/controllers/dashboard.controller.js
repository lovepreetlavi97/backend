const { User, Category, SubCategory, Product, Order, Transaction, Cart, Wishlist, Contact } = require('../models');

const getDashboardCounts = async (req, res) => {
  try {
    const [
      users,
      categories,
      subcategories,
      products,
      orders,
      refunds,
      carts,
      contacts
    ] = await Promise.all([
      User.count({ where: { role: 'user' } }),
      Category.count(),
      SubCategory.count(),
      Product.count(),
      Order.count(),
      Order.count({ where: { status: 'Refunded' } }),
      Cart.count(),
      Contact ? Contact.count() : Promise.resolve(0)
    ]);

    return res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: {
        users,
        categories,
        subcategories,
        relations: 0,
        products,
        festivals: 0,
        orders,
        refunds,
        revenue: 0,
        carts,
        contactQueries: contacts,
        wishlistItems: 0
      }
    });

  } catch (error) {
    return res.status(500).json({ status: 'error', statusCode: 500, message: 'Server error', error: error.message });
  }
};

const getDashboardPerformance = async (req, res) => {
  try {
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const year = new Date().getFullYear();
    const months = monthNames.map(m => ({ month: m, orders: 0, users: 0, revenue: 0 }));

    return res.status(200).json({
      status: 'success',
      statusCode: 200,
      data: { year, months }
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', statusCode: 500, message: 'Server error', error: error.message });
  }
};

module.exports = { getDashboardCounts, getDashboardPerformance };