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
      metalIds: (function(ids) {
        if (!ids) return [];
        if (Array.isArray(ids)) return ids;
        if (typeof ids === 'string') {
          if (ids.startsWith('[') && ids.endsWith(']')) {
            try { return JSON.parse(ids); } catch (e) { return [ids]; }
          }
          return ids.split(',').map(s => s.trim()).filter(s => s !== '');
        }
        return ids;
      })(metalIds),
      isBlocked: false,
      productCount: 0
    };

    const category = await create(Category, categoryData);

    await cacheUtils.clearPattern('category_menu_structure_*');
    await cacheUtils.clearPattern('categories_*');

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
      .populate('metalIds', 'name')
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
    let imageKey = null;
    if (req.file) {
      const { buffer, originalname, mimetype } = req.file;
      imageKey = await uploadToSpaces(buffer, originalname, mimetype);
    }
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
    if (metalIds) {
      category.metalIds = (function(ids) {
        if (!ids) return [];
        if (Array.isArray(ids)) return ids;
        if (typeof ids === 'string') {
          if (ids.startsWith('[') && ids.endsWith(']')) {
            try { return JSON.parse(ids); } catch (e) { return [ids]; }
          }
          return ids.split(',').map(s => s.trim()).filter(s => s !== '');
        }
        return ids;
      })(metalIds);
    }
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
    await cacheUtils.clearPattern('categories_*');
    await cacheUtils.clearPattern('category_menu_structure_*');
    
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
    await cacheUtils.clearPattern('categories_*');
    await cacheUtils.clearPattern('category_menu_structure_*');
    
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
    await cacheUtils.clearPattern('categories_*');
    await cacheUtils.clearPattern('category_menu_structure_*');
    
    return successResponse(res, 200, messages.CATEGORY_DELETED);

  } catch (error) {
    console.error("Delete category error:", error);
    return errorResponse(res, 500, error.message || "Failed to delete category");
  }
};

// Get category menu structure (Nested Category → Subcategory → Child Subcategory)
const getCategoryMenu = async (req, res) => {
  try {
    const { metalId, _refresh } = req.query;
    const cacheKey = `category_menu_structure_${metalId || 'all'}`;
    
    // Allow manual refresh via query param
    if (_refresh !== 'true') {
      const cachedMenu = await cacheUtils.get(cacheKey);
      if (cachedMenu) {
        return successResponse(res, 200, "Category menu retrieved", cachedMenu);
      }
    }

    const isActiveQuery = { isBlocked: false, isDeleted: false };
    
    // 1. Fetch EVERYTHING active
    const [allCategories, allSubcategories] = await Promise.all([
      Category.find(isActiveQuery).lean(),
      require('../models/subCategory.model').find(isActiveQuery).lean()
    ]);

    let filteredSubcategories = allSubcategories;
    let filteredCategories = allCategories;

    // 2. If metalId is specified, filter subcategories first
    if (metalId && mongoose.Types.ObjectId.isValid(metalId)) {
      const targetMetalId = new mongoose.Types.ObjectId(metalId);
      
      // Keep subcategories that match the metal
      filteredSubcategories = allSubcategories.filter(sub => 
        sub.metalIds && sub.metalIds.some(id => id.toString() === metalId)
      );

      // Keep categories that either match the metal themselves 
      // OR have at least one subcategory that matches the metal (recursively)
      const matchingCategoryIds = new Set();
      
      // a. Categories directly matching metal
      allCategories.forEach(cat => {
        if (cat.metalIds && cat.metalIds.some(id => id.toString() === metalId)) {
          matchingCategoryIds.add(cat._id.toString());
        }
      });

      // b. Categories matching via subcategories
      filteredSubcategories.forEach(sub => {
        const catId = sub.categoryId || sub.category;
        if (catId) matchingCategoryIds.add(catId.toString());
      });

      filteredCategories = allCategories.filter(cat => matchingCategoryIds.has(cat._id.toString()));
    }

    // 3. Build subcategory mapping for hierarchy (only from filtered ones)
    const subcategoryMap = {};
    filteredSubcategories.forEach(sub => {
      subcategoryMap[sub._id.toString()] = { ...sub, subcategories: [] };
    });

    // 4. Multi-level hierarchy building
    const rootSubcategories = [];
    filteredSubcategories.forEach(sub => {
      const subObj = subcategoryMap[sub._id.toString()];
      if (sub.parentId && subcategoryMap[sub.parentId.toString()]) {
        subcategoryMap[sub.parentId.toString()].subcategories.push(subObj);
      } else {
        rootSubcategories.push(subObj);
      }
    });

    // 5. Final Tree: Category → rootSubcategory → [Nested Subcategories]
    const menu = filteredCategories.map(cat => {
      const catIdStr = cat._id.toString();
      const catSubcategories = rootSubcategories.filter(sub => {
        const subCatId = sub.categoryId || sub.category;
        return subCatId && subCatId.toString() === catIdStr;
      });

      return {
        ...cat,
        subcategories: catSubcategories
      };
    });

    // Filter out categories that ended up with no children IF it didn't match the metal itself
    // (Optional: depending on luxury expectations, we might want to hide empty parent categories)
    const finalMenu = menu.filter(m => 
      m.subcategories.length > 0 || 
      (metalId && m.metalIds && m.metalIds.some(id => id.toString() === metalId)) ||
      !metalId
    );

    // Cache the result for better performance
    await cacheUtils.set(cacheKey, finalMenu, 3600); 

    return successResponse(res, 200, "Category menu structure retrieved", finalMenu);
  } catch (error) {
    console.error("Get category menu structure error:", error);
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
