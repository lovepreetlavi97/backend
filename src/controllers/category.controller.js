const { 
  create, 
  findOne, 
  findMany, 
  findAndUpdate, 
  deleteOne 
} = require('../services/mongodb/mongoService');
const { Category, Product } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");
const mongoose = require('mongoose');
const slugify = require('slugify');

// Create a new category
const createCategory = async (req, res) => {
  try {
    const { name, description, isFeatured } = req.body;
    
    // Basic validation
    if (!name) {
      return errorResponse(res, 400, "Category name is required");
    }
    
    // Check for duplicate category name
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existingCategory) {
      return errorResponse(res, 409, "Category with this name already exists");
    }
    
    // Handle image
    const imageUrl = req.file.originalname;
    if (!imageUrl) {
      return errorResponse(res, 400, "Image is required");
    }
    
    // Create slug
    const slug = slugify(name, { lower: true, strict: true });
    
    // Prepare category data
    const categoryData = {
      name,
      slug,
      description,
      images: imageUrl,
      isFeatured: isFeatured,
      isBlocked: false,
      productCount: 0
    };
    
    const category = await create(Category, categoryData);
    
    // Clear cache after creating new category
    await cacheUtils.delPattern('categories_*');
    
    return successResponse(res, 201, messages.CATEGORY_CREATED, { category });

  } catch (error) {
    console.error("Create category error:", error);
    return errorResponse(res, 500, error.message || "Failed to create category");
  }
};

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'name', 
      sortOrder = 'asc',
      isBlocked,
      search
    } = req.query;
    
    // Create cache key based on query parameters
    const cacheKey = `categories_admin_${page}_${limit}_${sortBy}_${sortOrder}_${isBlocked || ''}_${search || ''}`;
    
    // Try to get from cache first
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      return successResponse(res, 200, messages.CATEGORIES_RETRIEVED, cachedData);
    }
    
    // Build query
    const query = {};
    
    if (isBlocked !== undefined) {
      query.isBlocked = isBlocked === 'true';
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    // Execute query with pagination
    const categories = await Category.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOptions)
      .lean();
    
    const total = await Category.countDocuments(query);
    
    const result = {
      categories,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    };
    
    // Cache the result
    await cacheUtils.set(cacheKey, result, 300); // Cache for 5 minutes
    
    return successResponse(res, 200, messages.CATEGORIES_RETRIEVED, result);

  } catch (error) {
    console.error("Get all categories error:", error);
    return errorResponse(res, 500, error.message || "Failed to retrieve categories");
  }
};

// Get active categories (user endpoint)
const getActiveCategories = async (req, res) => {
  try {
    // Try to get from cache first
    const cacheKey = 'categories_active';
    const cachedData = await cacheUtils.get(cacheKey);
    
    if (cachedData) {
      return successResponse(res, 200, messages.CATEGORIES_RETRIEVED, { categories: cachedData });
    }
    
    // Get only non-blocked and non-deleted categories
    const categories = await Category.find({ 
      isBlocked: false,
      isDeleted: false
    })
    .select('name slug description images')
    .lean();
    
    // Cache the result
    await cacheUtils.set(cacheKey, categories, 600); // Cache for 10 minutes
    
    return successResponse(res, 200, messages.CATEGORIES_RETRIEVED, { categories });
  } catch (error) {
    console.error("Get active categories error:", error);
    return errorResponse(res, 500, error.message || "Failed to retrieve categories");
  }
};

// Get a category by ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid category ID format");
    }
    
    // Try to get from cache first
    const cacheKey = `category_${id}`;
    const cachedCategory = await cacheUtils.get(cacheKey);
    
    if (cachedCategory) {
      return successResponse(res, 200, messages.CATEGORY_RETRIEVED, { category: cachedCategory });
    }
    
    // If not in cache, get from database
    const category = await Category.findById(id).lean();
    
    if (!category) {
      return errorResponse(res, 404, messages.CATEGORY_NOT_FOUND);
    }
    
    // Cache the result
    await cacheUtils.set(cacheKey, category, 600); // Cache for 10 minutes
    
    return successResponse(res, 200, messages.CATEGORY_RETRIEVED, { category });

  } catch (error) {
    console.error("Get category error:", error);
    return errorResponse(res, 500, error.message || "Failed to retrieve category");
  }
};

// Update a category by ID
const updateCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isBlocked, isFeatured } = req.body;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid category ID format");
    }
    
    // Fetch the current category
    const category = await Category.findById(id);
    if (!category) {
      return errorResponse(res, 404, messages.CATEGORY_NOT_FOUND);
    }
    
    // Check for name uniqueness if name is being updated
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (existingCategory) {
        return errorResponse(res, 409, "Another category with this name already exists");
      }
      
      // Update slug if name is changing
      category.slug = slugify(name, { lower: true, strict: true });
    }
    
    // Update text fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (isBlocked !== undefined) category.isBlocked = isBlocked === 'true' || isBlocked === true;
    if (isFeatured !== undefined) category.isFeatured = isFeatured === 'true' || isFeatured === true;
    // Handle image update
    const newImage = req.files?.[0]?.location;
    if (newImage) {
      category.images = newImage;
    }
    
    // Save the updated category
    await category.save();
    
    // Clear related cache
    await cacheUtils.del(`category_${id}`);
    await cacheUtils.delPattern('categories_*');
    
    return successResponse(res, 200, messages.CATEGORY_UPDATED, { category });
  } catch (error) {
    console.error("Update category error:", error);
    return errorResponse(res, 500, error.message || "Failed to update category");
  }
};

// Toggle category blocked status
const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid category ID format");
    }
    
    const category = await Category.findById(id);
    if (!category) {
      return errorResponse(res, 404, messages.CATEGORY_NOT_FOUND);
    }
    
    // Toggle blocked status
    category.isBlocked = !category.isBlocked;
    await category.save();
    
    // Clear related cache
    await cacheUtils.del(`category_${id}`);
    await cacheUtils.delPattern('categories_*');
    
    return successResponse(res, 200, 
      !category.isBlocked ? "Category unblocked successfully" : "Category blocked successfully", 
      { category }
    );
  } catch (error) {
    console.error("Toggle category status error:", error);
    return errorResponse(res, 500, error.message || "Failed to update category status");
  }
};

// Delete a category by ID (soft delete)
const deleteCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid category ID format");
    }
    
    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return errorResponse(res, 404, messages.CATEGORY_NOT_FOUND);
    }
    
    // Check if there are associated products
    const productsCount = await Product.countDocuments({ categoryId: id, isDeleted: false });
    if (productsCount > 0) {
      return errorResponse(res, 400, `Cannot delete category. ${productsCount} products are associated with this category`);
    }
    
    // Hard delete the category
    await Category.findByIdAndDelete(id);
    
    // Clear related cache
    await cacheUtils.del(`category_${id}`);
    await cacheUtils.delPattern('categories_*');
    
    return successResponse(res, 200, messages.CATEGORY_DELETED);

  } catch (error) {
    console.error("Delete category error:", error);
    return errorResponse(res, 500, error.message || "Failed to delete category");
  }
};

// Export the functions
module.exports = {
  createCategory,
  getAllCategories,
  getActiveCategories,
  getCategoryById,
  updateCategoryById,
  toggleCategoryStatus,
  deleteCategoryById
};
