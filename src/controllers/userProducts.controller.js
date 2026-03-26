const { Product, Category, SubCategory, Festival, Gift, Relation, CuratedCollection } = require("../models/index");
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");

const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    let { page = 1, limit = 20, color, material, purity, style, gender, relation, ...filters } = req.query;
    page = parseInt(page, 10) > 0 ? parseInt(page, 10) : 1;
    limit = parseInt(limit, 10) > 0 ? parseInt(limit, 10) : 20;
    const skip = (page - 1) * limit;

    if (!slug || typeof slug !== "string") {
      return errorResponse(res, 400, "Invalid product slug");
    }

    console.log(`🔍 [getProductBySlug] Processing slug: ${slug}`);

    const cacheKey = `product_slug_${slug}_${JSON.stringify(filters)}_${color || ''}_${material || ''}_${purity || ''}_${style || ''}_${gender || ''}_${relation || ''}_${page}_${limit}`;
    const cached = await cacheUtils.get(cacheKey);

    if (cached) {
      return successResponse(res, 200, messages.PRODUCT_RETRIEVED, cached);
    }

    let slugConditions = [];
    const lowerSlug = slug.toLowerCase();

    if (lowerSlug === 'all') {
      slugConditions = [{}];
    } else if (lowerSlug === 'gift-store') {
      slugConditions = [{
        $or: [
          { "attributes.giftIds.0": { $exists: true } },
          { "attributes.occasions.0": { $exists: true } },
          { "relationIds.0": { $exists: true } }
        ]
      }];
    } else {
      const [category, subcategory, festivals, relations, gift, curated] = await Promise.all([
        Category.findOne({ slug: { $regex: new RegExp(`^${slug}$`, "i") } }),
        SubCategory.findOne({ slug: { $regex: new RegExp(`^${slug}$`, "i") } }),
        Festival.find({ slug: { $regex: new RegExp(`^${slug}$`, "i") } }),
        Relation.findOne({ slug: { $regex: new RegExp(`^${slug}$`, "i") } }),
        Gift.findOne({ slug: { $regex: new RegExp(`^${slug}$`, "i") } }),
        CuratedCollection.findOne({ slug: { $regex: new RegExp(`^${slug}$`, "i") } }),
      ]);

      const festivalIds = festivals.map((f) => f._id);
      
      // Dynamic filters from curated collection
      let curatedFilters = null;
      if (curated && curated.filters) {
        const f = curated.filters;
        const subCond = [];
        if (f.categoryIds?.length) subCond.push({ categoryId: { $in: f.categoryIds } });
        if (f.subcategoryIds?.length) subCond.push({ subcategoryId: { $in: f.subcategoryIds } });
        if (f.relationIds?.length) subCond.push({ relationIds: { $in: f.relationIds } });
        if (f.festivalIds?.length) subCond.push({ festivalIds: { $in: f.festivalIds } });
        
        if (subCond.length > 0) {
           curatedFilters = { $and: subCond };
        }
      }

      slugConditions = [
        category ? { categoryId: category._id } : null,
        subcategory ? { subcategoryId: subcategory._id } : null,
        festivalIds.length > 0 ? { festivalIds: { $in: festivalIds } } : null,
        relations ? { relationIds: relations._id } : null,
        gift ? { "attributes.giftIds": gift._id } : null,
        curated ? { collectionIds: curated._id } : null, // Manual assignment
        curatedFilters, // Dynamic filters from curated collection
      ].filter(Boolean);
    }

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
      $and: slug.toLowerCase() === 'all' ? [] : [{ $or: slugConditions }],
    };

    // Calculate available filters before applying selected filters (to show all options within a category)
    const baseQuery = { ...query };
    const [colors, materials, purities, styles] = await Promise.all([
      Product.distinct("attributes.color", { ...baseQuery, "attributes.color": { $ne: null, $ne: "" } }),
      Product.distinct("attributes.material", { ...baseQuery, "attributes.material": { $ne: null, $ne: "" } }),
      Product.distinct("attributes.purity", { ...baseQuery, "attributes.purity": { $ne: null, $ne: "" } }),
      Product.distinct("attributes.style", { ...baseQuery, "attributes.style": { $ne: null, $ne: "" } })
    ]);

    if (color) {
      query.$and.push({ "attributes.color": { $in: Array.isArray(color) ? color : [color] } });
    }
    if (material) {
      query.$and.push({ "attributes.material": { $in: Array.isArray(material) ? material : [material] } });
    }
    if (purity) {
      query.$and.push({ "attributes.purity": { $in: Array.isArray(purity) ? purity : [purity] } });
    }
    if (style) {
      query.$and.push({ "attributes.style": { $in: Array.isArray(style) ? style : [style] } });
    }
    if (gender) {
      query.$and.push({ "attributes.gender": { $in: Array.isArray(gender) ? gender : [gender] } });
    }
    if (relation) {
      query.$and.push({ relationIds: { $in: Array.isArray(relation) ? relation : [relation] } });
    }

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

    if (colors && colors.length > 0) parsedFilters.color = colors.filter(Boolean);
    if (materials && materials.length > 0) parsedFilters.material = materials.filter(Boolean);
    if (purities && purities.length > 0) parsedFilters.purity = purities.filter(Boolean);
    if (styles && styles.length > 0) parsedFilters.style = styles.filter(Boolean);

    // Fetch CATEGORY TREE for sidebar
    const [allCategories, allSubcategories] = await Promise.all([
      Category.find({ isDeleted: false, isBlocked: false }).select("name slug").lean(),
      SubCategory.find({ isDeleted: false, isBlocked: false }).select("name slug parentId categoryId").lean()
    ]);

    const { buildTree } = require("../utils/treeBuilder");
    const byCategory = new Map();
    for (const s of allSubcategories) {
      if (!s.categoryId) continue;
      const cid = String(s.categoryId);
      if (!byCategory.has(cid)) byCategory.set(cid, []);
      byCategory.get(cid).push(s);
    }
    const categoryTree = allCategories.map(c => {
      const flat = byCategory.get(String(c._id)) || [];
      return { ...c, subcategories: buildTree(flat, { idKey: "_id", parentKey: "parentId" }) };
    });

    const responseData = {
      products: enhancedProducts,
      availableFilters: parsedFilters,
      categoryTree,
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
    console.error("❌ ERROR in getProductBySlug:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack,
      slug: req.params.slug
    });
  }
};

module.exports = {
  getProductBySlug,
};
