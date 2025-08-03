const { Product, Category, SubCategory, Festival } = require("../models/index");
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");

const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const filters = req.query;

    if (!slug || typeof slug !== "string") {
      return errorResponse(res, 400, "Invalid product slug");
    }

    const cacheKey = `product_slug_${slug}_${JSON.stringify(filters)}`;
    const cached = await cacheUtils.get(cacheKey);

    if (cached) {
      return successResponse(res, 200, messages.PRODUCT_RETRIEVED, {
        product: cached,
      });
    }

    // Match category/subcategory/festival by name (slug)
    const [category, subcategory, festivals] = await Promise.all([
      Category.findOne({ name: { $regex: new RegExp(`^${slug}$`, "i") } }),
      SubCategory.findOne({ name: { $regex: new RegExp(`^${slug}$`, "i") } }),
      Festival.find({ name: { $regex: new RegExp(`^${slug}$`, "i") } }),
    ]);

    const festivalIds = festivals.map((f) => f._id);

    const query = {
      $and: [
        {
          $or: [
            category ? { categoryId: category._id } : null,
            subcategory ? { subcategoryId: subcategory._id } : null,
            festivalIds.length > 0
              ? { festivalIds: { $in: festivalIds } }
              : null,
          ].filter(Boolean),
        },
      ],
    };

    // Add filters dynamically
    if (filters.price) {
      const priceConditions = Array.isArray(filters.price)
        ? filters.price
        : [filters.price];

      const priceRanges = priceConditions
        .map((range) => {
          const [min, max] = range.split("-").map(Number);
          if (!isNaN(min) && !isNaN(max)) {
            return {
              discountedPrice: {
                $gte: min,
                $lt: max === Infinity ? Number.MAX_SAFE_INTEGER : max,
              },
            };
          } else if (range === "above-5000") {
            return { discountedPrice: { $gt: 5000 } };
          }
          return null;
        })
        .filter(Boolean);

      if (priceRanges.length > 0) {
        query.$and.push({ $or: priceRanges });
      }
    }

    // Handle other filters like metal/style/occasion
    ["metal", "style", "occasion"].forEach((key) => {
      if (filters[key]) {
        const values = Array.isArray(filters[key])
          ? filters[key]
          : [filters[key]];
        query.$and.push({ [key]: { $in: values } });
      }
    });

    const products = await Product.find(query)
      .populate({ path: "categoryId", select: "name" })
      .populate({ path: "subcategoryId", select: "name" })
      .populate({ path: "festivalIds", select: "name" })
      .populate({ path: "relationIds", select: "name" })
      .lean();

    if (!products || products.length === 0) {
      return errorResponse(res, 400, messages.PRODUCT_NOT_FOUND);
    }

    const enhancedProducts = products.map((product) => {
      if (product.actualPrice && product.discountedPrice) {
        product.discountPercentage = Math.round(
          ((product.actualPrice - product.discountedPrice) /
            product.actualPrice) *
            100
        );
      }
      return product;
    });

    await cacheUtils.set(cacheKey, enhancedProducts, 600); // Cache with filters

    return successResponse(res, 200, messages.PRODUCT_RETRIEVED, {
      products: enhancedProducts,
    });
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
