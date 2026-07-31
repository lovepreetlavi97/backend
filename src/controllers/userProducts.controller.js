const { Product, Category, SubCategory } = require("../models/index");
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");

const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    let { page = 1, limit = 20 } = req.query;
    page = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    limit = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 20;
    const offset = (page - 1) * limit;

    if (!slug || typeof slug !== "string") {
      return errorResponse(res, 400, "Invalid product slug");
    }

    const { count, rows: products } = await Product.findAndCountAll({
      limit,
      offset,
      order: [['id', 'DESC']]
    });

    const responseData = {
      products,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };

    return successResponse(res, 200, messages.PRODUCT_RETRIEVED, responseData);
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to fetch products");
  }
};

module.exports = {
  getProductBySlug,
};
