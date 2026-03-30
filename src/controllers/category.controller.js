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
const { uploadToSpaces } = require("../middlewares/uploadMiddleware"); // Add this at top if not already

// Create a new category
const createCategory = async (req, res) => {
  try {
    const { name, description, isFeatured, metalIds } = req.body;

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
    if (!req.file) {
      return errorResponse(res, 400, "Image is required");
    }

    const { buffer, originalname, mimetype } = req.file;
    const imageKey = await uploadToSpaces(buffer, originalname, mimetype);

    // Create slug
    const slug = slugify(name, { lower: true, strict: true });

    // Prepare category data
    const categoryData = {
      name,
      slug,
      description,
      image: imageKey, // save only the image key
      isFeatured: isFeatured,
      metalIds: typeof metalIds === 'string' ? JSON.parse(metalIds) : metalIds,
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
      search,
      metalId
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
    
    if (metalId && mongoose.Types.ObjectId.isValid(metalId)) {
      query.metalIds = { $in: [new mongoose.Types.ObjectId(metalId)] };
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
    const { metalId } = req.query;
    // Try to get from cache first
    const cacheKey = `categories_active_${metalId || 'all'}`;
    const cachedData = await cacheUtils.get(cacheKey);
    
    if (cachedData) {
      return successResponse(res, 200, messages.CATEGORIES_RETRIEVED, { categories: cachedData });
    }
    
    // Get only non-blocked and non-deleted categories
    const query = { 
      isBlocked: false,
      isDeleted: false
    };

    if (metalId && mongoose.Types.ObjectId.isValid(metalId)) {
      query.metalIds = { $in: [new mongoose.Types.ObjectId(metalId)] };
    }

    const categories = await Category.find(query)
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
    const category = await Category.findById(id).populate('metalIds', 'name colorCode gradient').lean();
    
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
    const { name, description, isBlocked, isFeatured, image, metalIds } = req.body;
        const { buffer, originalname, mimetype } = req.file;
    const imageKey = await uploadToSpaces(buffer, originalname, mimetype);
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
    if (metalIds) category.metalIds = typeof metalIds === 'string' ? JSON.parse(metalIds) : metalIds;
    // Handle image update
    
    if (imageKey) {
      category.image =imageKey;
    }else {
       category.image = image
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

// Get category menu structure (Nested Category → Subcategory → Child Subcategory)
const getCategoryMenu = async (req, res) => {
  try {
    const { metalId } = req.query;
    const cacheKey = `category_menu_structure_${metalId || 'all'}`;
    const cachedMenu = await cacheUtils.get(cacheKey);

    if (cachedMenu) {
      return successResponse(res, 200, "Category menu retrieved", cachedMenu);
    }

    // Fetch all active categories and subcategories
    const query = { isBlocked: false, isDeleted: false };
    if (metalId && mongoose.Types.ObjectId.isValid(metalId)) {
      query.metalIds = { $in: [new mongoose.Types.ObjectId(metalId)] };
    }

    const [categories, subcategories] = await Promise.all([
      Category.find(query).lean(),
      require('../models/subCategory.model').find(query).lean()
    ]);

    // Create a map of subcategories by ID for easy lookup
    const subcategoryMap = {};
    subcategories.forEach(sub => {
      subcategoryMap[sub._id.toString()] = { ...sub, subcategories: [] };
    });

    // Build subcategory hierarchy (Child Subcategory → Parent Subcategory)
    const rootSubcategories = [];
    subcategories.forEach(sub => {
      const subObj = subcategoryMap[sub._id.toString()];
      if (sub.parentId) {
        const parent = subcategoryMap[sub.parentId.toString()];
        if (parent) {
          parent.subcategories.push(subObj);
        }
      } else {
        rootSubcategories.push(subObj);
      }
    });

    // Attach root subcategories to their respective categories
    const menu = categories.map(cat => {
      const catSubcategories = rootSubcategories.filter(sub => 
        sub.categoryId && sub.categoryId.toString() === cat._id.toString()
      );
      return {
        ...cat,
        subcategories: catSubcategories
      };
    });

    await cacheUtils.set(cacheKey, menu, 3600); // Cache for 1 hour

    return successResponse(res, 200, "Category menu retrieved", menu);
  } catch (error) {
    console.error("Get category menu error:", error);
    return errorResponse(res, 500, error.message || "Failed to retrieve category menu");
  }
};

// Export the functions
module.exports = {
  getCategoryMenu,
  createCategory,
  getAllCategories,
  getActiveCategories,
  getCategoryById,
  updateCategoryById,
  toggleCategoryStatus,
  deleteCategoryById
};
