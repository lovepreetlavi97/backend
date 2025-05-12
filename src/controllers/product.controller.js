const { 
  create, 
  findOne, 
  findMany, 
  findAndUpdate, 
  deleteOne 
} = require('../services/mongodb/mongoService');

const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { Product, Category, SubCategory } = require('../models/index');
const mongoose = require('mongoose');
const { cacheUtils } = require("../config/redis");
const slugify = require('slugify');

// Create a new product
const createProduct = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      shortDescription, 
      actualPrice, 
      discountedPrice, 
      weight, 
      unit = 'kg',
      stock,
      categoryId, 
      subcategoryId, 
      festivalIds, 
      relationIds,
      specifications,
      tags,
      isFeatured,
      dimensions,
      shippingInfo,
      warranty,
      sku
    } = req.body;
    
    // Basic validation
    if (!name || !description) {
      return errorResponse(res, 400, 'Product name and description are required');
    }
    
    if (!actualPrice || isNaN(parseFloat(actualPrice)) || parseFloat(actualPrice) <= 0) {
      return errorResponse(res, 400, 'Valid actual price is required');
    }
    
    if (discountedPrice && (isNaN(parseFloat(discountedPrice)) || parseFloat(discountedPrice) < 0)) {
      return errorResponse(res, 400, 'Discounted price must be a valid positive number');
    }
    
    if (discountedPrice && parseFloat(discountedPrice) > parseFloat(actualPrice)) {
      return errorResponse(res, 400, 'Discounted price cannot be greater than actual price');
    }
    
    // Validate category ID
    if (categoryId) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return errorResponse(res, 400, 'Invalid category ID format');
      }
      
      const categoryExists = await Category.exists({ _id: categoryId });
      if (!categoryExists) {
        return errorResponse(res, 404, 'Category not found');
      }
    } else {
      return errorResponse(res, 400, 'Category ID is required');
    }
    
    // Validate subcategory ID
    if (subcategoryId) {
      if (!mongoose.Types.ObjectId.isValid(subcategoryId)) {
        return errorResponse(res, 400, 'Invalid subcategory ID format');
      }
      
      const subcategoryExists = await SubCategory.exists({ _id: subcategoryId });
      if (!subcategoryExists) {
        return errorResponse(res, 404, 'Subcategory not found');
      }
    }
    
    // Process images
    // Extract main image and additional images
    let mainImageUrl = '';
    let additionalImageUrls = [];
    
    if (req.files) {
      // Main image (single file)
      if (req.files.image && req.files.image.length > 0) {
        mainImageUrl = req.files.image[0].location;
      }
      
      // Additional images (array of files)
      if (req.files.images && req.files.images.length > 0) {
        additionalImageUrls = req.files.images.map(file => file.location);
      }
    }
    
    // Combine main image with additional images for the images array
    const allImageUrls = [mainImageUrl, ...additionalImageUrls].filter(url => url);
    
    if (allImageUrls.length === 0) {
      return errorResponse(res, 400, 'At least one product image is required');
    }
    
    // Generate a unique slug
    let baseSlug = slugify(name, { lower: true, strict: true });
    const randomStr = Math.random().toString(36).substring(2, 8);
    const slug = `${baseSlug}-${randomStr}`;
    
    // Validate tags
    const validTags = ['New', 'Sale', 'Bestseller'];
    const productTag = validTags.includes(tags) ? tags : 'New';
    
    // Process specifications
    let processedSpecs = [];
    if (specifications) {
      if (typeof specifications === 'string') {
        try {
          processedSpecs = JSON.parse(specifications);
        } catch (e) {
          return errorResponse(res, 400, 'Invalid specifications format');
        }
      } else if (Array.isArray(specifications)) {
        processedSpecs = specifications;
      }
    }
    
    // Build product data
    const productData = {
      name,
      slug,
      description,
      shortDescription,
      actualPrice: parseFloat(actualPrice),
      discountedPrice: discountedPrice ? parseFloat(discountedPrice) : undefined,
      weight: parseFloat(weight),
      unit,
      stock: stock ? parseInt(stock) : 0,
      image: mainImageUrl || allImageUrls[0], // Set main image field
      images: allImageUrls, // Set all images array
      categoryId: new mongoose.Types.ObjectId(categoryId),
      subcategoryId: subcategoryId ? new mongoose.Types.ObjectId(subcategoryId) : undefined,
      festivalIds: festivalIds ? (Array.isArray(festivalIds) ? festivalIds : [festivalIds]).filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id)) : [],
      relationIds: relationIds ? (Array.isArray(relationIds) ? relationIds : [relationIds]).filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => new mongoose.Types.ObjectId(id)) : [],
      specifications: processedSpecs,
      tags: productTag,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      isInStock: stock ? parseInt(stock) > 0 : false,
      dimensions: dimensions ? (typeof dimensions === 'string' ? JSON.parse(dimensions) : dimensions) : undefined,
      shippingInfo: shippingInfo ? (typeof shippingInfo === 'string' ? JSON.parse(shippingInfo) : shippingInfo) : undefined,
      warranty,
      sku,
      createdBy: req.user?._id
    };

    const product = await create(Product, productData);
    
    // Clear product cache
    await cacheUtils.delPattern('products_*');
    
    return successResponse(res, 201, messages.PRODUCT_CREATED, { product });
  } catch (error) {
    console.error("Create Product Error: ", error);
    return errorResponse(res, 500, error.message || 'Error creating product');
  }
};

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc', 
      categoryId, 
      subcategoryId,
      festivalId,
      minPrice,
      maxPrice,
      inStock,
      search,
      isFeatured
    } = req.query;
    
    // Create cache key based on query parameters
    const cacheKey = `products_${page}_${limit}_${sortBy}_${sortOrder}_${categoryId || ''}_${subcategoryId || ''}_${festivalId || ''}_${minPrice || ''}_${maxPrice || ''}_${inStock || ''}_${search || ''}_${isFeatured || ''}`;
    
    // Try to get from cache first
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      return successResponse(res, 200, messages.PRODUCTS_RETRIEVED, cachedData);
    }
    
    // Build query
    const query = { isDeleted: false };
    
    if (categoryId) {
      query.categoryId = mongoose.Types.ObjectId.isValid(categoryId) ? new mongoose.Types.ObjectId(categoryId) : null;
    }
    
    if (subcategoryId) {
      query.subcategoryId = mongoose.Types.ObjectId.isValid(subcategoryId) ? new mongoose.Types.ObjectId(subcategoryId) : null;
    }
    
    if (festivalId) {
      query.festivalIds = mongoose.Types.ObjectId.isValid(festivalId) ? new mongoose.Types.ObjectId(festivalId) : null;
    }
    
    if (minPrice !== undefined) {
      query.actualPrice = { ...query.actualPrice, $gte: parseFloat(minPrice) };
    }
    
    if (maxPrice !== undefined) {
      query.actualPrice = { ...query.actualPrice, $lte: parseFloat(maxPrice) };
    }
    
    if (inStock === 'true') {
      query.isInStock = true;
    }
    
    if (isFeatured === 'true') {
      query.isFeatured = true;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    // Execute query with pagination
    const products = await Product.find(query)
      .populate({ path: 'categoryId', select: 'name slug' })
      .populate({ path: 'subcategoryId', select: 'name slug' })
      .populate({ path: 'festivalIds', select: 'name slug' })
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOptions)
      .lean();
    
    const total = await Product.countDocuments(query);
    
    const result = {
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    };
    
    // Cache the result
    await cacheUtils.set(cacheKey, result, 300); // Cache for 5 minutes
    
    return successResponse(res, 200, products.length > 0 ? messages.PRODUCTS_RETRIEVED : messages.PRODUCTS_NOT_FOUND, result);
  } catch (error) {
    console.error("Error fetching products:", error);
    return errorResponse(res, 500, messages.PRODUCT_FETCH_ERROR, { error: error.message });
  }
};

// Get a product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, 'Invalid product ID format');
    }
    
    // Try to get from cache first
    const cacheKey = `product_${id}`;
    const cachedProduct = await cacheUtils.get(cacheKey);
    
    if (cachedProduct) {
      return successResponse(res, 200, messages.PRODUCT_RETRIEVED, { product: cachedProduct });
    }
    
    // If not in cache, get from database with populated fields
    const product = await Product.findById(id)
      .populate({ path: 'categoryId', select: 'name slug' })
      .populate({ path: 'subcategoryId', select: 'name slug' })
      .populate({ path: 'festivalIds', select: 'name slug' })
      .populate({ path: 'relationIds', select: 'name' })
      .lean();
    
    if (!product) {
      return errorResponse(res, 404, messages.PRODUCT_NOT_FOUND);
    }
    
    // Calculate discount percentage
    if (product.actualPrice && product.discountedPrice) {
      product.discountPercentage = Math.round(((product.actualPrice - product.discountedPrice) / product.actualPrice) * 100);
    }
    
    // Cache the result
    await cacheUtils.set(cacheKey, product, 600); // Cache for 10 minutes
    
    return successResponse(res, 200, messages.PRODUCT_RETRIEVED, { product });
  } catch (error) {
    console.error("Get product error:", error);
    return errorResponse(res, 500, error.message || 'Error retrieving product');
  }
};

// Update a product by ID
const updateProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, 'Invalid product ID format');
    }
    
    const { deletedImages, ...updatedData } = req.body;
    
    // Find the product first
    const product = await Product.findById(id);
    if (!product) {
      return errorResponse(res, 404, messages.PRODUCT_NOT_FOUND);
    }
    
    // Process deleted images
    const deletedImagesArray = Array.isArray(deletedImages) ? deletedImages : [deletedImages].filter(Boolean);
    
    // Handle new image uploads
    let newMainImageUrl = '';
    let newAdditionalImageUrls = [];
    
    if (req.files) {
      // Main image (single file)
      if (req.files.image && req.files.image.length > 0) {
        newMainImageUrl = req.files.image[0].location;
      }
      
      // Additional images (array of files)
      if (req.files.images && req.files.images.length > 0) {
        newAdditionalImageUrls = req.files.images.map(file => file.location);
      }
    }
    
    // Update the images array and main image
    if (newMainImageUrl || newAdditionalImageUrls.length > 0 || deletedImagesArray.length > 0) {
      // Start with current images and remove deleted ones
      let currentImages = product.images.filter(img => !deletedImagesArray.includes(img));
      
      // Add new images
      updatedData.images = [...currentImages, ...newAdditionalImageUrls].filter(url => url);
      
      // Update main image if a new one was uploaded
      if (newMainImageUrl) {
        updatedData.image = newMainImageUrl;
      } else if (updatedData.images.length > 0 && (!product.image || deletedImagesArray.includes(product.image))) {
        // If main image was deleted and there are other images, use the first one as main image
        updatedData.image = updatedData.images[0];
      }
    }
    
    // Handle numeric fields
    if (updatedData.actualPrice) {
      updatedData.actualPrice = parseFloat(updatedData.actualPrice);
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
    if (updatedData.categoryId && updatedData.categoryId !== 'null') {
      if (!mongoose.Types.ObjectId.isValid(updatedData.categoryId)) {
        return errorResponse(res, 400, 'Invalid category ID format');
      }
      updatedData.categoryId = new mongoose.Types.ObjectId(updatedData.categoryId);
    } else if (updatedData.categoryId === 'null') {
      updatedData.categoryId = null;
    }
    
    if (updatedData.subcategoryId && updatedData.subcategoryId !== 'null') {
      if (!mongoose.Types.ObjectId.isValid(updatedData.subcategoryId)) {
        return errorResponse(res, 400, 'Invalid subcategory ID format');
      }
      updatedData.subcategoryId = new mongoose.Types.ObjectId(updatedData.subcategoryId);
    } else if (updatedData.subcategoryId === 'null') {
      updatedData.subcategoryId = null;
    }
    
    // Process festivalIds
    if (updatedData.festivalIds) {
      const festivalIds = Array.isArray(updatedData.festivalIds)
        ? updatedData.festivalIds
        : [updatedData.festivalIds];
      
      updatedData.festivalIds = festivalIds
        .filter(id => id && id !== '')
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
    }
    
    // Process relationIds
    if (updatedData.relationIds) {
      const relationIds = Array.isArray(updatedData.relationIds)
        ? updatedData.relationIds
        : [updatedData.relationIds];
      
      updatedData.relationIds = relationIds
        .filter(id => id && id !== '')
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
    }
    
    // Process specifications
    if (updatedData.specifications) {
      if (typeof updatedData.specifications === 'string') {
        try {
          updatedData.specifications = JSON.parse(updatedData.specifications);
        } catch (e) {
          delete updatedData.specifications;
        }
      }
    }
    
    // Validate tags
    if (updatedData.tags) {
      const validTags = ['New', 'Sale', 'Bestseller'];
      if (!validTags.includes(updatedData.tags)) {
        updatedData.tags = 'New';
      }
    }
    
    // Process boolean fields
    if (updatedData.isFeatured !== undefined) {
      updatedData.isFeatured = updatedData.isFeatured === 'true' || updatedData.isFeatured === true;
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
    
    // Update the product
    const updatedProduct = await findAndUpdate(
      Product, 
      { _id: id }, 
      updatedData
    );
    
    // Clear product cache
    await cacheUtils.del(`product_${id}`);
    await cacheUtils.delPattern('products_*');
    
    return successResponse(res, 200, messages.PRODUCT_UPDATED, { product: updatedProduct });
  } catch (error) {
    console.error("Update product error:", error);
    return errorResponse(res, 500, error.message || 'Error updating product');
  }
};

// Delete a product by ID
const deleteProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, 'Invalid product ID format');
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
    await cacheUtils.delPattern('products_*');
    
    return successResponse(res, 200, messages.PRODUCT_DELETED);
  } catch (error) {
    console.error("Delete product error:", error);
    return errorResponse(res, 500, error.message || 'Error deleting product');
  }
};

// Toggle block status
const toggleBlockStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, 'Invalid product ID format');
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
    await cacheUtils.delPattern('products_*');
    
    return successResponse(res, 200, 
      product.isBlocked ? 'Product blocked successfully' : 'Product unblocked successfully',
      { isBlocked: product.isBlocked }
    );
  } catch (error) {
    console.error("Toggle block status error:", error);
    return errorResponse(res, 500, error.message || 'Error toggling block status');
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProductById,
  deleteProductById,
  toggleBlockStatus
};
