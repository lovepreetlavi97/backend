const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { Product, Category, SubCategory, PriceRule, Metal, CuratedCollection } = require("../models/index");
const { isValidId } = require("../utils/idUtils");
const { cacheUtils } = require("../config/redis");
const slugify = require("slugify");
const { Op } = require("sequelize");

const parseIdArray = (input) => {
  if (!input) return [];
  let arr;
  try {
    if (typeof input === "string") {
      const parsed = JSON.parse(input);
      arr = typeof parsed === "string" ? [parsed] : parsed;
    } else if (Array.isArray(input)) {
      arr = input;
    } else if (isValidId(input)) {
      arr = [input];
    } else {
      return [];
    }
  } catch {
    if (isValidId(input)) {
      arr = [input];
    } else {
      return [];
    }
  }

  return arr
    .filter((id) => isValidId(id))
    .map((id) => isNaN(Number(id)) ? id : Number(id));
};

const parseImagesArray = (input) => {
  if (!input) return [];
  let arr;
  try {
    arr = typeof input === "string" ? JSON.parse(input) : input;
  } catch (err) {
    return [];
  }

  return Array.isArray(arr)
    ? arr.filter(
        (imgPath) => typeof imgPath === "string" && imgPath.trim() !== ""
      )
    : [];
};

// Create a new product
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      actualPrice,
      discountedPrice,
      discountPercent,
      weight,
      unit = "gm",
      stock,
      categoryId,
      subcategoryId,
      festivalIds,
      relationIds,
      relatedProductIds,
      specifications,
      tags,
      isFeatured,
      dimensions,
      shippingInfo,
      warranty,
      sku,
      image,
      images,
      isPriceFixed,
      priceRuleId,
      makingCharges,
      attributes,
      collectionIds,
      metalIds,
    } = req.body;

    if (!name || !description) {
      return errorResponse(res, 400, "Product name and description are required");
    }

    const parsedIsPriceFixed = String(isPriceFixed) === "true";
    if (parsedIsPriceFixed) {
      if (!actualPrice || isNaN(parseFloat(actualPrice)) || parseFloat(actualPrice) <= 0) {
        return errorResponse(res, 400, "Valid actual price is required for fixed price products");
      }
    } else {
      if (!priceRuleId || !isValidId(priceRuleId)) {
        return errorResponse(res, 400, "Valid price rule ID is required for dynamic price products");
      }
      if (!weight || isNaN(parseFloat(weight)) || parseFloat(weight) <= 0) {
        return errorResponse(res, 400, "Valid weight is required for dynamic price products");
      }
      if (discountPercent !== undefined && discountPercent !== null && discountPercent !== "") {
        const d = parseFloat(discountPercent);
        if (isNaN(d) || d < 0 || d > 100) {
          return errorResponse(res, 400, "Discount percent must be between 0 and 100 for dynamic price products");
        }
      }
    }

    if (discountedPrice && (isNaN(parseFloat(discountedPrice)) || parseFloat(discountedPrice) < 0)) {
      return errorResponse(res, 400, "Discounted price must be a valid positive number");
    }

    if (parsedIsPriceFixed && discountedPrice && parseFloat(discountedPrice) > parseFloat(actualPrice)) {
      return errorResponse(res, 400, "Discounted price cannot be greater than actual price");
    }

    if (categoryId) {
      if (!isValidId(categoryId)) {
        return errorResponse(res, 400, "Invalid category ID format");
      }
      const categoryExists = await Category.findByPk(categoryId);
      if (!categoryExists) {
        return errorResponse(res, 404, "Category not found");
      }
    } else {
      return errorResponse(res, 400, "Category ID is required");
    }

    if (subcategoryId) {
      if (!isValidId(subcategoryId)) {
        return errorResponse(res, 400, "Invalid subcategory ID format");
      }
      const subcategoryExists = await SubCategory.findByPk(subcategoryId);
      if (!subcategoryExists) {
        return errorResponse(res, 404, "Subcategory not found");
      }
    }

    let baseSlug = slugify(name, { lower: true, strict: true });
    const randomStr = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomStr}`;

    const validTags = ["New", "Sale", "Bestseller"];
    const productTag = validTags.includes(tags) ? tags : "New";

    let processedSpecs = [];
    if (specifications) {
      if (typeof specifications === "string") {
        try { processedSpecs = JSON.parse(specifications); } catch (e) { return errorResponse(res, 400, "Invalid specifications format"); }
      } else if (Array.isArray(specifications)) {
        processedSpecs = specifications;
      }
    }

    let processedAttributes = {};
    if (attributes) {
      if (typeof attributes === "string") {
        try { processedAttributes = JSON.parse(attributes); } catch (e) { return errorResponse(res, 400, "Invalid attributes format"); }
      } else if (typeof attributes === "object") {
        processedAttributes = attributes;
      }
    }

    let computedActualPrice = parsedIsPriceFixed ? parseFloat(actualPrice || 0) : 0;

    const productData = {
      title: name,
      slug,
      description,
      image: image || "",
      images: parseImagesArray(images),
      shortDescription,
      basePrice: computedActualPrice,
      actualPrice: computedActualPrice,
      discountedPrice: parsedIsPriceFixed ? (discountedPrice ? parseFloat(discountedPrice) : undefined) : undefined,
      discountPercent: !parsedIsPriceFixed && discountPercent !== undefined && discountPercent !== null && discountPercent !== "" ? parseFloat(discountPercent) : 0,
      isPriceFixed: parsedIsPriceFixed,
      priceRuleId: !parsedIsPriceFixed ? priceRuleId : undefined,
      makingCharge: makingCharges ? parseFloat(makingCharges) : 0,
      weight: parseFloat(weight || 0),
      unit,
      stock: stock ? parseInt(stock) : 0,
      categoryId: categoryId,
      subcategoryId: subcategoryId || undefined,
      festivalIds: parseIdArray(festivalIds),
      relationIds: parseIdArray(relationIds),
      relatedProductIds: parseIdArray(req.body.relatedProductIds),
      collectionIds: parseIdArray(collectionIds),
      metalIds: parseIdArray(metalIds),
      specifications: processedSpecs,
      attributes: processedAttributes,
      tags: productTag,
      isFeatured: isFeatured === "true" || isFeatured === true,
      dimensions: dimensions ? (typeof dimensions === "string" ? JSON.parse(dimensions) : dimensions) : undefined,
      shippingInfo: shippingInfo ? (typeof shippingInfo === "string" ? JSON.parse(shippingInfo) : shippingInfo) : undefined,
      warranty,
      sku,
      createdBy: req.user?.id || req.user?._id,
    };

    const product = await Product.create(productData);

    await cacheUtils.delPattern("products_*");
    await cacheUtils.delPattern("product_slug_*");

    return successResponse(res, 201, messages.PRODUCT_CREATED, { product });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Error creating product");
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const {
      limit = 12,
      page = 1,
      lastId,
      occasion,
      color,
      material,
      gender,
      subcategoryId,
      categoryId,
      minPrice,
      maxPrice,
      search,
      style,
      collectionId,
      metalId,
      includeBlocked = "true"
    } = req.query;

    const where = {};

    if (includeBlocked !== "true") {
      where.isBlocked = false;
    }

    if (categoryId && isValidId(categoryId)) {
      where.categoryId = categoryId;
    }

    if (subcategoryId && isValidId(subcategoryId)) {
      where.subcategoryId = subcategoryId;
    }

    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) where.basePrice[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.basePrice[Op.lte] = parseFloat(maxPrice);
    }

    if (search) {
      const searchStr = String(search).trim();
      if (searchStr) {
        where[Op.or] = [
          { title: { [Op.like]: `%${searchStr}%` } },
          { description: { [Op.like]: `%${searchStr}%` } }
        ];
      }
    }

    if (lastId && isValidId(lastId)) {
      where.id = { [Op.lt]: Number(lastId) };
    }

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      limit: parsedLimit,
      offset,
      order: [['id', 'DESC']],
      include: [
        { model: Category, attributes: ['id', 'name'] },
        { model: SubCategory, attributes: ['id', 'name'] }
      ]
    });

    const totalPages = Math.ceil(count / parsedLimit);
    const result = {
      products,
      pagination: {
        total: count,
        page: parsedPage,
        limit: parsedLimit,
        pages: totalPages
      },
      nextCursor: products.length === parsedLimit ? products[products.length - 1].id : null,
      hasMore: products.length === parsedLimit
    };

    return successResponse(res, 200, messages.PRODUCTS_RETRIEVED, result);

  } catch (error) {
    return errorResponse(res, 500, messages.PRODUCT_FETCH_ERROR, {
      error: error.message,
    });
  }
};

// Get a product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return errorResponse(res, 400, "Invalid product ID format");
    }

    const cacheKey = `product_${id}`;
    const cachedProduct = await cacheUtils.get(cacheKey);

    if (cachedProduct) {
      return successResponse(res, 200, messages.PRODUCT_RETRIEVED, {
        product: cachedProduct,
      });
    }

    const product = await Product.findByPk(id, {
      include: [
        { model: Category, attributes: ['id', 'name'] },
        { model: SubCategory, attributes: ['id', 'name'] },
        { model: PriceRule, attributes: ['id', 'name', 'value'] }
      ]
    });

    if (!product) {
      return errorResponse(res, 404, messages.PRODUCT_NOT_FOUND);
    }

    const productJson = product.toJSON();

    if (!productJson.isPriceFixed && product.PriceRule && product.PriceRule.value) {
      const priceVal = Number(product.PriceRule.value);
      productJson.actualPrice = (priceVal * (Number(product.weight) || 0)) + (Number(product.makingCharge) || 0);
      if (productJson.discountPercent && productJson.discountPercent > 0) {
        const discounted = productJson.actualPrice * (1 - (productJson.discountPercent / 100));
        productJson.discountedPrice = parseFloat(discounted.toFixed(2));
      }
    }

    if (productJson.actualPrice && productJson.discountedPrice) {
      productJson.discountPercentage = Math.round(
        ((productJson.actualPrice - productJson.discountedPrice) / productJson.actualPrice) * 100
      );
    }

    await cacheUtils.set(cacheKey, productJson, 600);

    return successResponse(res, 200, messages.PRODUCT_RETRIEVED, { product: productJson });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Error retrieving product");
  }
};

// Update a product by ID
const updateProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return errorResponse(res, 400, "Invalid product ID format");
    }

    const product = await Product.findByPk(id);
    if (!product) {
      return errorResponse(res, 404, messages.PRODUCT_NOT_FOUND);
    }

    const { ...updatedData } = req.body;

    if (updatedData.name) {
      updatedData.title = updatedData.name;
      let baseSlug = slugify(updatedData.name, { lower: true, strict: true });
      const randomStr = Math.random().toString(36).substring(2, 8);
      updatedData.slug = `${baseSlug}-${randomStr}`;
    }

    if (updatedData.categoryId && isValidId(updatedData.categoryId)) {
      updatedData.categoryId = Number(updatedData.categoryId);
    }
    if (updatedData.subcategoryId && isValidId(updatedData.subcategoryId)) {
      updatedData.subcategoryId = Number(updatedData.subcategoryId);
    }

    await product.update(updatedData);

    await cacheUtils.del(`product_${id}`);
    await cacheUtils.delPattern("products_*");
    await cacheUtils.delPattern("product_slug_*");

    return successResponse(res, 200, messages.PRODUCT_UPDATED, {
      product,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Error updating product");
  }
};

// Delete a product by ID
const deleteProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return errorResponse(res, 400, "Invalid product ID format");
    }

    const product = await Product.findByPk(id);
    if (!product) {
      return errorResponse(res, 404, messages.PRODUCT_NOT_FOUND);
    }

    await product.destroy();

    await cacheUtils.del(`product_${id}`);
    await cacheUtils.delPattern("products_*");
    await cacheUtils.delPattern("product_slug_*");

    return successResponse(res, 200, messages.PRODUCT_DELETED);
  } catch (error) {
    return errorResponse(res, 500, error.message || "Error deleting product");
  }
};

// Toggle block status
const toggleBlockStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return errorResponse(res, 400, "Invalid product ID format");
    }

    const product = await Product.findByPk(id);
    if (!product) {
      return errorResponse(res, 404, messages.PRODUCT_NOT_FOUND);
    }

    product.isBlocked = !product.isBlocked;
    await product.save();

    await cacheUtils.del(`product_${id}`);
    await cacheUtils.delPattern("products_*");
    await cacheUtils.delPattern("product_slug_*");

    return successResponse(
      res,
      200,
      product.isBlocked ? "Product blocked successfully" : "Product unblocked successfully",
      { isBlocked: product.isBlocked }
    );
  } catch (error) {
    return errorResponse(res, 500, error.message || "Error toggling block status");
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProductById,
  deleteProductById,
  toggleBlockStatus,
};
