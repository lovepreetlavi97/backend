const { Product, Category, SubCategory, Festival } = require("../models/index");
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");

const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    let { page = 1, limit = 20, ...filters } = req.query;
    page = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    limit = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 20;
    const skip = (page - 1) * limit;

    if (!slug || typeof slug !== "string") {
      return errorResponse(res, 400, "Invalid product slug");
    }

    const cacheKey = `product_slug_${slug}_${JSON.stringify(filters)}_${page}_${limit}`;
    const cached = await cacheUtils.get(cacheKey);

    if (cached) {
      return successResponse(res, 200, messages.PRODUCT_RETRIEVED, cached);
    }

    const [category, subcategory, festivals] = await Promise.all([
      Category.findOne({ name: { $regex: new RegExp(`^${slug}$`, "i") } }),
      SubCategory.findOne({ name: { $regex: new RegExp(`^${slug}$`, "i") } }),
      Festival.find({ slug: { $regex: new RegExp(`^${slug}$`, "i") } }),
    ]);

    const festivalIds = festivals.map((f) => f._id);

    const slugConditions = [
      category ? { categoryId: category._id } : null,
      subcategory ? { subcategoryId: subcategory._id } : null,
      festivalIds.length > 0 ? { festivalIds: { $in: festivalIds } } : null,
    ].filter(Boolean);

    if (slugConditions.length === 0) {
      const responseData = {
        products: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };

      await cacheUtils.set(cacheKey, responseData, 600);
      return successResponse(res, 200, messages.PRODUCT_NOT_FOUND, responseData);
    }

    const query = {
      isDeleted: false,
      isBlocked: false,
      $and: [{ $or: slugConditions }],
    };

    if (filters.price) {
      const priceConditions = Array.isArray(filters.price)
        ? filters.price
        : [filters.price];

      const priceRanges = priceConditions
        .map((range) => {
          if (range === "under-1500") {
            return { discountedPrice: { $lt: 1500 } };
          } else if (range === "above-5000") {
            return { discountedPrice: { $gt: 5000 } };
          } else {
            const [min, max] = range.split("-").map(Number);
            if (!isNaN(min) && !isNaN(max)) {
              return {
                discountedPrice: {
                  $gte: min,
                  $lt: max === Infinity ? Number.MAX_SAFE_INTEGER : max,
                },
              };
            }
          }
          return null;
        })
        .filter(Boolean);

      if (priceRanges.length > 0) {
        query.$and.push({ $or: priceRanges });
      }
    }

    const excludeKeys = ["price", "sort", "search", "order"];
    Object.keys(filters).forEach((key) => {
      if (!excludeKeys.includes(key) && filters[key]) {
        const values = Array.isArray(filters[key])
          ? filters[key]
          : [filters[key]];
        query.$and.push({ [`filters.${key}`]: { $in: values } });
      }
    });

    const total = await Product.countDocuments(query);

    const products = await Product.find(query)
      .populate({ path: "categoryId", select: "name" })
      .populate({ path: "subcategoryId", select: "name" })
      .populate({ path: "festivalIds", select: "name" })
      .populate({ path: "relationIds", select: "name" })
      .populate({ path: "priceRuleId", select: "name price" })
      .skip(skip)
      .limit(limit)
      .lean();

    if (!products || products.length === 0) {
      return successResponse(res, 200, messages.PRODUCT_NOT_FOUND);
    }

    const enhancedProducts = products.map((product) => {

      // Dynamic price calculation
      if (
        product.isPriceFixed === false &&
        product.priceRuleId &&
        product.priceRuleId.price
      ) {
        const rate = product.priceRuleId.price;
        const weight = product.weight || 0;
        const making = product.makingCharges || 0;

        product.actualPrice = (rate * weight) + making;
        if (product.discountPercent && product.discountPercent > 0) {
          const discounted = product.actualPrice * (1 - (product.discountPercent / 100));
          product.discountedPrice = parseFloat(discounted.toFixed(2));
        }
      }

      // Discount calculation
      if (product.actualPrice && product.discountedPrice) {
        product.discountPercentage = Math.round(
          ((product.actualPrice - product.discountedPrice) /
            product.actualPrice) *
          100
        );
      }

      return product;
    });

    const availableFilters = {};
    products.forEach((p) => {
      if (p.filters && typeof p.filters === "object") {
        Object.keys(p.filters).forEach((key) => {
          if (!availableFilters[key]) availableFilters[key] = new Set();
          if (Array.isArray(p.filters[key])) {
            p.filters[key].forEach((v) => availableFilters[key].add(v));
          } else if (typeof p.filters[key] === "string") {
            availableFilters[key].add(p.filters[key]);
          }
        });
      }
    });

    const parsedFilters = {};
    Object.keys(availableFilters).forEach((key) => {
      parsedFilters[key] = Array.from(availableFilters[key]);
    });

    const responseData = {
      products: enhancedProducts,
      availableFilters: parsedFilters,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await cacheUtils.set(cacheKey, responseData, 600);

    return successResponse(res, 200, messages.PRODUCT_RETRIEVED, responseData);
  } catch (error) {
    console.error("Get product by slug error:", error);
    return errorResponse(
      res,
      500,
      error.message || "Error retrieving product by slug"
    );
  }
};

module.exports = {
  getProductBySlug,
};
