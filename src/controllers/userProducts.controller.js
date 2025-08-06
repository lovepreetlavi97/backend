const { Product, Category, SubCategory, Festival } = require("../models/index");
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");

const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    console.log({slug})
    let { page = 1, limit = 20, ...filters } = req.query;
    page = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    limit = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 20;
    const skip = (page - 1) * limit;

    if (!slug || typeof slug !== "string") {
      return errorResponse(res, 400, "Invalid product slug");
    }

    // Exclude page and limit from cache filters
    const cacheKey = `product_slug_${slug}_${JSON.stringify(filters)}_${page}_${limit}`;
    const cached = await cacheUtils.get(cacheKey);

    if (cached) {
      return successResponse(res, 200, messages.PRODUCT_RETRIEVED, cached);
    }

    console.log("Fetching product by slug:", slug);
    // Match category/subcategory/festival by name (slug)
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

    const query = {
      isDeleted: false,
      isBlocked: false,
      $and: [],
    };

    if (slugConditions.length > 0) {
      query.$and.push({ $or: slugConditions });
    } else {
      console.log(
        "No matching category, subcategory, or festival found for slug:",
        slug
      );
    }

    // Add filters dynamically
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

    console.log("Filters applied:", filters);
    console.log("Query conditions:", JSON.stringify(query, null, 2));

    // Handle other filters like metal/style/occasion
    ["metal", "style", "occasion"].forEach((key) => {
      if (filters[key]) {
        const values = Array.isArray(filters[key])
          ? filters[key]
          : [filters[key]];
        query.$and.push({ [key]: { $in: values } });
      }
    });

    // Get total count for pagination
    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate({ path: "categoryId", select: "name" })
      .populate({ path: "subcategoryId", select: "name" })
      .populate({ path: "festivalIds", select: "name" })
      .populate({ path: "relationIds", select: "name" })
      .skip(skip)
      .limit(limit)
      .lean();
    
    if (!products || products.length === 0) {
      return successResponse(res, 200, messages.PRODUCT_NOT_FOUND);
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

    const responseData = {
      products: enhancedProducts,
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
