const {
  create,
  findOne,
  findMany,
  findAndUpdate,
  deleteOne,
} = require("../services/mongodb/mongoService");
const {
  uploadToSpaces,
  uploadMultipleImages,
} = require("../middlewares/uploadMiddleware");
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { Product, Category, SubCategory, PriceRule } = require("../models/index");
const mongoose = require("mongoose");

const { cacheUtils } = require("../config/redis");
const slugify = require("slugify");
const parseObjectIdArray = (input) => {
  if (!input) return [];

  let arr;

  try {
    if (typeof input === "string") {
      const parsed = JSON.parse(input);
      arr = typeof parsed === "string" ? [parsed] : parsed;
    } else if (Array.isArray(input)) {
      arr = input;
    } else if (
      typeof input === "string" &&
      mongoose.Types.ObjectId.isValid(input)
    ) {
      arr = [input];
    } else {
      return [];
    }
  } catch {
    if (mongoose.Types.ObjectId.isValid(input)) {
      arr = [input];
    } else {
      return [];
    }
  }

  return arr
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
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
    console.log("Request Files: ", req.body);
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
      relatedProductIds ,
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
    } = req.body;
    console.log("Request Body: ", req.body);
   // return
    // Basic validation
    if (!name || !description) {
      return errorResponse(
        res,
        400,
        "Product name and description are required"
      );
    }

    const parsedIsPriceFixed = String(isPriceFixed) === "true";
    if (parsedIsPriceFixed) {
      if (!actualPrice || isNaN(parseFloat(actualPrice)) || parseFloat(actualPrice) <= 0) {
        return errorResponse(res, 400, "Valid actual price is required for fixed price products");
      }
    } else {
      if (!priceRuleId || !mongoose.Types.ObjectId.isValid(priceRuleId)) {
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

    if (
      discountedPrice &&
      (isNaN(parseFloat(discountedPrice)) || parseFloat(discountedPrice) < 0)
    ) {
      return errorResponse(
        res,
        400,
        "Discounted price must be a valid positive number"
      );
    }

    if (
      parsedIsPriceFixed && discountedPrice &&
      parseFloat(discountedPrice) > parseFloat(actualPrice)
    ) {
      return errorResponse(
        res,
        400,
        "Discounted price cannot be greater than actual price"
      );
    }

    // Validate category ID
    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return errorResponse(res, 400, "Invalid category ID format");
      }

      const categoryExists = await Category.exists({ _id: categoryId });
      if (!categoryExists) {
        return errorResponse(res, 404, "Category not found");
      }
    } else {
      return errorResponse(res, 400, "Category ID is required");
    }

    // Validate subcategory ID
    if (subcategoryId) {
      if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
        return errorResponse(res, 400, "Invalid subcategory ID format");
      }

      const subcategoryExists = await SubCategory.exists({
        _id: subcategoryId,
      });
      if (!subcategoryExists) {
        return errorResponse(res, 404, "Subcategory not found");
      }
    }

    // Generate a unique slug
    let baseSlug = slugify(name, { lower: true, strict: true });
    const randomStr = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomStr}`;

    // Validate tags
    const validTags = ["New", "Sale", "Bestseller"];
    const productTag = validTags.includes(tags) ? tags : "New";

    // Process specifications
    let processedSpecs = [];
    if (specifications) {
      if (typeof specifications === "string") {
        try {
          processedSpecs = JSON.parse(specifications);
        } catch (e) {
          return errorResponse(res, 400, "Invalid specifications format");
        }
      } else if (Array.isArray(specifications)) {
        processedSpecs = specifications;
      }
    }

    // Process attributes
    let processedAttributes = {};
    if (attributes) {
      if (typeof attributes === "string") {
        try {
          processedAttributes = JSON.parse(attributes);
        } catch (e) {
          return errorResponse(res, 400, "Invalid attributes format");
        }
      } else if (typeof attributes === "object") {
        processedAttributes = attributes;
      }
    }

    // For fixed price products we store actualPrice directly.
    // For dynamic products we keep stored actualPrice at 0 and always compute it at read-time from priceRuleId.
    let computedActualPrice = parsedIsPriceFixed ? parseFloat(actualPrice || 0) : 0;

    // Build product data
    const productData = {
      name,
      slug,
      description,
      image: image,
      images: images,
      shortDescription,
      actualPrice: computedActualPrice,
      discountedPrice: parsedIsPriceFixed
        ? (discountedPrice ? parseFloat(discountedPrice) : undefined)
        : undefined,
      discountPercent: !parsedIsPriceFixed && discountPercent !== undefined && discountPercent !== null && discountPercent !== ""
        ? parseFloat(discountPercent)
        : 0,
      isPriceFixed: parsedIsPriceFixed,
      priceRuleId: !parsedIsPriceFixed ? new mongoose.Types.ObjectId(priceRuleId) : undefined,
      makingCharges: makingCharges ? parseFloat(makingCharges) : 0,
      weight: parseFloat(weight),
      unit,
      stock: stock ? parseInt(stock) : 0,
      image: image, // Set main image field
      images: images, // Set all images array
      categoryId: new mongoose.Types.ObjectId(categoryId),
      subcategoryId: subcategoryId
        ? new mongoose.Types.ObjectId(subcategoryId)
        : undefined,
      festivalIds: parseObjectIdArray(festivalIds),
      relationIds: parseObjectIdArray(relationIds),
      relatedProductIds : parseObjectIdArray(req.body.relatedProductIds),
      collectionIds: parseObjectIdArray(collectionIds),
      specifications: processedSpecs,
      attributes: processedAttributes,
      tags: productTag,
      isFeatured: isFeatured === "true" || isFeatured === true,
      // isInStock: stock ? parseInt(stock) > 0 : false,
      dimensions: dimensions
        ? typeof dimensions === "string"
          ? JSON.parse(dimensions)
          : dimensions
        : undefined,
      shippingInfo: shippingInfo
        ? typeof shippingInfo === "string"
          ? JSON.parse(shippingInfo)
          : shippingInfo
        : undefined,
      warranty,
      sku,
      createdBy: req.user?._id,
    };
    console.log("Product Data: ", productData);

    const product = await create(Product, productData);

    // Clear product cache
    await cacheUtils.delPattern("products_*");
    await cacheUtils.delPattern("product_slug_*");

    return successResponse(res, 201, messages.PRODUCT_CREATED, { product });
  } catch (error) {
    console.error("Create Product Error: ", error);
    return errorResponse(res, 500, error.message || "Error creating product");
  }
};

// Get all products (Cursor-based Pagination for High Performance)
const getAllProducts = async (req, res) => {
  try {
    const {
      limit = 12,
      lastId, // Cursor
      occasion,
      color,
      material,
      gender,
      subcategoryId,
      minPrice,
      maxPrice,
      search,
      style,
      collectionId,
    } = req.query;

    // STEP 1: BUILD FILTER QUERY
    const filter = {
      isDeleted: false,
      isBlocked: false,
      ...(occasion && { "attributes.occasions": occasion }),
      ...(color && { "attributes.color": color }),
      ...(material && { "attributes.material": material }),
      ...(gender && { "attributes.gender": gender }),
      ...(subcategoryId && mongoose.Types.ObjectId.isValid(subcategoryId) && { subcategoryId: new mongoose.Types.ObjectId(subcategoryId) }),
      ...(minPrice && { actualPrice: { $gte: parseFloat(minPrice) } }),
      ...(maxPrice && { actualPrice: { $lte: parseFloat(maxPrice) } }),
      ...(style && { "attributes.style": style }),
      ...(collectionId && mongoose.Types.ObjectId.isValid(collectionId) && { collectionIds: new mongoose.Types.ObjectId(collectionId) })
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    // STEP 2: APPLY CURSOR (using _id for constant time pagination)
    if (lastId && mongoose.Types.ObjectId.isValid(lastId)) {
      filter._id = { $lt: new mongoose.Types.ObjectId(lastId) };
    }

    // Try to get from cache first (optional, but good for speed)
    const cacheKey = `products_cursor_${lastId || "initial"}_${limit}_${JSON.stringify(filter)}`;
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      return successResponse(res, 200, messages.PRODUCTS_RETRIEVED, cachedData);
    }

    // STEP 3: QUERY
    const products = await Product.find(filter)
      .sort({ _id: -1 }) // Important for consistent cursor
      .limit(parseInt(limit))
      .select("name slug image actualPrice discount averageRating isPriceFixed priceRuleId weight makingCharges") // Added weight/charges for potential read-time compute
      .lean();

    // Optional: Dynamic Price Calculation for those without fixed prices
    // This ensures consistency even if select is limited.
    for (let product of products) {
      if (!product.isPriceFixed && product.priceRuleId) {
        // Note: priceRuleId isn't populated here as per "no heavy populate" rule.
        // If frontend needs it, they should fetch it or we should store pre-calculated price.
      }
    }

    // STEP 4: NEXT CURSOR
    const nextCursor = products.length === parseInt(limit)
      ? products[products.length - 1]._id
      : null;

    const result = {
      data: products,
      nextCursor: nextCursor,
      hasMore: products.length === parseInt(limit)
    };

    // Cache the result for 5 minutes
    await cacheUtils.set(cacheKey, result, 300);

    return successResponse(res, 200, messages.PRODUCTS_RETRIEVED, result);

  } catch (error) {
    console.error("Error fetching products (cursor):", error);
    return errorResponse(res, 500, messages.PRODUCT_FETCH_ERROR, {
      error: error.message,
    });
  }
};

// Get a product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid product ID format");
    }

    // Try to get from cache first
    const cacheKey = `product_${id}`;
    const cachedProduct = await cacheUtils.get(cacheKey);

    if (cachedProduct) {
      return successResponse(res, 200, messages.PRODUCT_RETRIEVED, {
        product: cachedProduct,
      });
    }

    // If not in cache, get from database with populated fields
    const product = await Product.findById(id)
      .populate({ path: "categoryId", select: "name" })
      .populate({ path: "subcategoryId", select: "name" })
      .populate({ path: "festivalIds", select: "name" })
      .populate({ path: "relationIds", select: "name" })
      .populate({ path: "relatedProductIds", select: "name" })
      .populate({ path: "priceRuleId", select: "name price" })
      .lean();

    if (!product) {
      return errorResponse(res, 404, messages.PRODUCT_NOT_FOUND);
    }
    console;
    // Dynamic Price Calculation
    if (!product.isPriceFixed && product.priceRuleId && product.priceRuleId.price) {
        product.actualPrice = (product.priceRuleId.price * (product.weight || 0)) + (product.makingCharges || 0);
        if (product.discountPercent && product.discountPercent > 0) {
          const discounted = product.actualPrice * (1 - (product.discountPercent / 100));
          product.discountedPrice = parseFloat(discounted.toFixed(2));
        }
    }

    // Calculate discount percentage
    if (product.actualPrice && product.discountedPrice) {
      product.discountPercentage = Math.round(
        ((product.actualPrice - product.discountedPrice) /
          product.actualPrice) *
          100
      );
    }

    // Cache the result
    await cacheUtils.set(cacheKey, product, 600); // Cache for 10 minutes

    return successResponse(res, 200, messages.PRODUCT_RETRIEVED, { product });
  } catch (error) {
    console.error("Get product error:", error);
    return errorResponse(res, 500, error.message || "Error retrieving product");
  }
};

// Update a product by ID
const updateProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid product ID format");
    }

    const { ...updatedData } = req.body;

    // Find the product first
    const product = await Product.findById(id);
    if (!product) {
      return errorResponse(res, 404, messages.PRODUCT_NOT_FOUND);
    }

    // Handle numeric fields
    if (updatedData.isPriceFixed !== undefined) {
      updatedData.isPriceFixed = String(updatedData.isPriceFixed) === "true";
    }

    // Only update actualPrice from input if fixed; for dynamic keep stored actualPrice at 0 (computed at read-time)
    if (updatedData.isPriceFixed) {
      if (updatedData.actualPrice) {
        updatedData.actualPrice = parseFloat(updatedData.actualPrice);
      }
    } else {
      updatedData.actualPrice = 0;
      // If dynamic, ensure priceRuleId is captured
      if (updatedData.priceRuleId) {
        updatedData.priceRuleId = new mongoose.Types.ObjectId(updatedData.priceRuleId);
      }
    }

    // discountPercent (dynamic)
    if (updatedData.discountPercent !== undefined) {
      const d = parseFloat(updatedData.discountPercent);
      if (isNaN(d) || d < 0 || d > 100) {
        return errorResponse(res, 400, "Discount percent must be between 0 and 100");
      }
      updatedData.discountPercent = d;
    }
    
    if (updatedData.makingCharges !== undefined) {
        updatedData.makingCharges = parseFloat(updatedData.makingCharges);
    }

    if (updatedData.discountedPrice) {
      updatedData.discountedPrice = parseFloat(updatedData.discountedPrice);
    }

    if (updatedData.weight) {
      updatedData.weight = parseFloat(updatedData.weight);
    }

    if (updatedData.stock !== undefined) {
      updatedData.stock = parseInt(updatedData.stock);
      updatedData.isInStock = updatedData.stock > 0;
    }

    // Handle IDs
    if (updatedData.categoryId && updatedData.categoryId !== "null") {
      if (!mongoose.Types.ObjectId.isValid(updatedData.categoryId)) {
        return errorResponse(res, 400, "Invalid category ID format");
      }
      updatedData.categoryId = new mongoose.Types.ObjectId(
        updatedData.categoryId
      );
    } else if (updatedData.categoryId === "null") {
      updatedData.categoryId = null;
    }

    if (updatedData.subcategoryId && updatedData.subcategoryId !== "null") {
      if (!mongoose.Types.ObjectId.isValid(updatedData.subcategoryId)) {
        return errorResponse(res, 400, "Invalid subcategory ID format");
      }
      updatedData.subcategoryId = new mongoose.Types.ObjectId(
        updatedData.subcategoryId
      );
    } else if (updatedData.subcategoryId === "null") {
      updatedData.subcategoryId = null;
    }

    updatedData.festivalIds = parseObjectIdArray(updatedData.festivalIds);
    updatedData.relationIds = parseObjectIdArray(updatedData.relationIds);
    updatedData.relatedProductIds = parseObjectIdArray(updatedData.relatedProductIds);
    updatedData.collectionIds = parseObjectIdArray(updatedData.collectionIds);
    // Process specifications
    if (updatedData.specifications) {
      if (typeof updatedData.specifications === "string") {
        try {
          updatedData.specifications = JSON.parse(updatedData.specifications);
        } catch (e) {
          delete updatedData.specifications;
        }
      }
    }

    // Process attributes
    if (updatedData.attributes) {
      if (typeof updatedData.attributes === "string") {
        try {
          updatedData.attributes = JSON.parse(updatedData.attributes);
        } catch (e) {
          delete updatedData.attributes;
        }
      }
    }

    // Validate tags
    if (updatedData.tags) {
      const validTags = ["New", "Sale", "Bestseller"];
      if (!validTags.includes(updatedData.tags)) {
        updatedData.tags = "New";
      }
    }

    // If switching to dynamic pricing, discountedPrice should not be stored (it's computed at read-time)
    if (updatedData.isPriceFixed === false) {
      delete updatedData.discountedPrice;
    }
    // If switching to fixed pricing, discountPercent is not needed
    if (updatedData.isPriceFixed === true) {
      updatedData.discountPercent = 0;
    }

    // Process boolean fields
    if (updatedData.isFeatured !== undefined) {
      updatedData.isFeatured =
        updatedData.isFeatured === "true" || updatedData.isFeatured === true;
    }

    // Update slug if name is changed
    if (updatedData.name && updatedData.name !== product.name) {
      let baseSlug = slugify(updatedData.name, { lower: true, strict: true });
      const randomStr = Math.random().toString(36).substring(2, 8);
      updatedData.slug = `${baseSlug}-${randomStr}`;
    }

    // Set updatedBy field if user is available
    if (req.user?._id) {
      updatedData.updatedBy = req.user._id;
    }

    if (updatedData.image && updatedData.image !== "") {
      updatedData.image = updatedData.image;
    }

    if (Array.isArray(updatedData.images)) {
      if (updatedData.images.length === 0 || updatedData.images[0] === "") {
        updatedData.images = [];
      }
    }

    // Update the product
    const updatedProduct = await findAndUpdate(
      Product,
      { _id: id },
      updatedData
    );

    // Clear product cache
    await cacheUtils.del(`product_${id}`);
    await cacheUtils.delPattern("products_*");
    await cacheUtils.delPattern("product_slug_*");

    return successResponse(res, 200, messages.PRODUCT_UPDATED, {
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);
    return errorResponse(res, 500, error.message || "Error updating product");
  }
};

// Delete a product by ID
const deleteProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid product ID format");
    }

    // Use soft delete instead of hard delete
    const updatedProduct = await findAndUpdate(
      Product,
      { _id: id },
      { isDeleted: true }
    );

    if (!updatedProduct) {
      return errorResponse(res, 404, messages.PRODUCT_NOT_FOUND);
    }

    // Clear product cache
    await cacheUtils.del(`product_${id}`);
    await cacheUtils.delPattern("products_*");
    await cacheUtils.delPattern("product_slug_*");

    return successResponse(res, 200, messages.PRODUCT_DELETED);
  } catch (error) {
    console.error("Delete product error:", error);
    return errorResponse(res, 500, error.message || "Error deleting product");
  }
};

// Toggle block status
const toggleBlockStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid product ID format");
    }

    const product = await Product.findById(id);
    if (!product) {
      return errorResponse(res, 404, messages.PRODUCT_NOT_FOUND);
    }

    // Toggle block status
    product.isBlocked = !product.isBlocked;
    await product.save();

    // Clear product cache
    await cacheUtils.del(`product_${id}`);
    await cacheUtils.delPattern("products_*");
    await cacheUtils.delPattern("product_slug_*");

    return successResponse(
      res,
      200,
      product.isBlocked
        ? "Product blocked successfully"
        : "Product unblocked successfully",
      { isBlocked: product.isBlocked }
    );
  } catch (error) {
    console.error("Toggle block status error:", error);
    return errorResponse(
      res,
      500,
      error.message || "Error toggling block status"
    );
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
