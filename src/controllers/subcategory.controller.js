const { 
  create, 
  findOne, 
  findMany, 
  findAndUpdate, 
  deleteOne 
} = require('../services/mongodb/mongoService');

const { SubCategory, Category, Product } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const mongoose = require('mongoose');
const { uploadToSpaces } = require("../middlewares/uploadMiddleware"); // Add this at top if not already
const { cacheUtils } = require("../config/redis");
// Create a new subcategory
const createSubcategory = async (req, res) => {
  try {
    const { name, category, categoryId, parentId, isFeatured, metalIds } = req.body;
    console.log(name, category, isFeatured ,"name, category, isFeatured ")
    // Basic validation
    if (!name) {
      return errorResponse(res, 400, "Subcategory name is required");
    }

    if (name.length > 17) {
      return errorResponse(res, 400, "Subcategory name cannot exceed 17 characters");
    }

    const resolvedCategoryId = categoryId || category;

    // Validate category ID if provided
    if (resolvedCategoryId && !mongoose.Types.ObjectId.isValid(resolvedCategoryId)) {
      return errorResponse(res, 400, "Invalid category ID format");
    }

    // Check if category exists if provided
    if (resolvedCategoryId) {
      const categoryExists = await Category.findById(resolvedCategoryId);
      if (!categoryExists) {
        return errorResponse(res, 404, "Category not found");
      }
    }

    // Validate parentId (optional)
    if (parentId && !mongoose.Types.ObjectId.isValid(parentId)) {
      return errorResponse(res, 400, "Invalid parentId format");
    }
   // Handle image
    if (!req.file) {
      return errorResponse(res, 400, "Image is required");
    }

    const { buffer, originalname, mimetype } = req.file;
    const imageKey = await uploadToSpaces(buffer, originalname, mimetype);

    let parsedMetalIds = [];
    if (typeof metalIds === 'string' && metalIds.trim() !== '') {
      try {
        parsedMetalIds = JSON.parse(metalIds);
      } catch (e) {
        parsedMetalIds = [];
      }
    } else if (Array.isArray(metalIds)) {
      parsedMetalIds = metalIds;
    }

    const subcategoryData = {
      name,
      category: resolvedCategoryId,
      categoryId: resolvedCategoryId,
      parentId: parentId ? new mongoose.Types.ObjectId(parentId) : null,
      image: imageKey,
      isFeatured: isFeatured,
      isBlocked: false,
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
    };

    const subcategory = await create(SubCategory, subcategoryData);
    
    // Clear relevant caches
    await cacheUtils.clearPattern('category_menu_structure_*');
    await cacheUtils.clearPattern('categories_*');

    return successResponse(res, 201, messages.SUBCATEGORY_CREATED, { subcategory });
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

// Get all subcategories
const getAllSubcategories = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'name', 
      sortOrder = 'asc',
      isBlocked,
      search,
      category,
      categoryId,
      parentId,
      metalId
    } = req.query;

    // Build query
    const query = {};
    
    if (isBlocked !== undefined) {
      query.isBlocked = isBlocked === 'true';
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const resolvedCategoryId = categoryId || category;
    if (resolvedCategoryId && mongoose.Types.ObjectId.isValid(resolvedCategoryId)) {
      const oid = new mongoose.Types.ObjectId(resolvedCategoryId);
      query.$or = [{ category: oid }, { categoryId: oid }];
    }
    if (parentId !== undefined) {
      // parentId can be "null" to fetch roots
      if (parentId === "null" || parentId === "") {
        query.parentId = null;
      } else if (mongoose.Types.ObjectId.isValid(parentId)) {
        query.parentId = new mongoose.Types.ObjectId(parentId);
      } else {
        query.parentId = parentId;
      }
    }

    if (metalId && mongoose.Types.ObjectId.isValid(metalId)) {
      query.metalIds = { $in: [new mongoose.Types.ObjectId(metalId)] };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    console.log("Subcategory Query:", JSON.stringify(query, null, 2));
    const populate = [
      { path: 'category', select: 'name' },
      { path: 'categoryId', select: 'name' },
      { path: 'parentId', select: 'name' },
      { path: 'metalIds', select: 'name' },
    ];
    const subcategories = await SubCategory.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOptions)
      .populate(populate)
      .lean();

    const total = await SubCategory.countDocuments(query);

    const result = {
      subcategories,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    };

    return successResponse(res, 200, messages.SUBCATEGORIES_RETRIEVED, result);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Get a subcategory by ID
const getSubcategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid subcategory ID format");
    }

    const subcategory = await SubCategory.findById(id)
      .populate('category', 'name')
      .lean();

    if (!subcategory) {
      return errorResponse(res, 404, messages.SUBCATEGORY_NOT_FOUND);
    }

    return successResponse(res, 200, messages.SUBCATEGORY_RETRIEVED, { subcategory });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Update a subcategory by ID
const updateSubcategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, categoryId, isBlocked, isFeatured, parentId, metalIds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid subcategory ID format");
    }

    const resolvedCategoryId = categoryId || category;

    // Validate category ID if provided
    if (resolvedCategoryId && !mongoose.Types.ObjectId.isValid(resolvedCategoryId)) {
      return errorResponse(res, 400, "Invalid category ID format");
    }

    // Check if category exists if provided
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return errorResponse(res, 404, "Category not found");
      }
    }

    const updateData = {};
    if (name) {
      if (name.length > 17) {
        return errorResponse(res, 400, "Subcategory name cannot exceed 17 characters");
      }
      updateData.name = name;
    }
    if (resolvedCategoryId) {
      updateData.category = resolvedCategoryId;
      updateData.categoryId = resolvedCategoryId;
    }
    if (parentId !== undefined) {
      updateData.parentId = (parentId === "null" || parentId === "") ? null : parentId;
    }
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked === 'true' || isBlocked === true;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (metalIds) updateData.metalIds = (function(ids) {
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
    if (req.file) {
      const { buffer, originalname, mimetype } = req.file;
      const imageKey = await uploadToSpaces(buffer, originalname, mimetype);
      updateData.image = imageKey;
    }
    const subcategory = await SubCategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate([
      { path: 'category', select: 'name' },
      { path: 'categoryId', select: 'name' },
      { path: 'parentId', select: 'name' },
      { path: 'metalIds', select: 'name' }
    ]);

    if (!subcategory) {
      return errorResponse(res, 404, messages.SUBCATEGORY_NOT_FOUND);
    }

    // Clear relevant caches
    await cacheUtils.clearPattern('category_menu_structure_*');
    await cacheUtils.clearPattern('categories_*');
    await cacheUtils.del(`subcategory_${id}`);

    return successResponse(res, 200, messages.SUBCATEGORY_UPDATED, { subcategory });
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

// Toggle subcategory blocked status
const toggleSubcategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid subcategory ID format");
    }

    const subcategory = await SubCategory.findById(id);
    if (!subcategory) {
      return errorResponse(res, 404, messages.SUBCATEGORY_NOT_FOUND);
    }

    subcategory.isBlocked = !subcategory.isBlocked;
    await subcategory.save();

    // Clear relevant caches
    await cacheUtils.clearPattern('category_menu_structure_*');
    await cacheUtils.clearPattern('categories_*');
    await cacheUtils.del(`subcategory_${id}`);

    return successResponse(res, 200, 
      !subcategory.isBlocked ? "Subcategory unblocked successfully" : "Subcategory blocked successfully", 
      { subcategory }
    );
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Delete a subcategory by ID
const deleteSubcategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid subcategory ID format");
    }

    // Check if subcategory exists
    const subcategory = await SubCategory.findById(id);
    if (!subcategory) {
      return errorResponse(res, 404, messages.SUBCATEGORY_NOT_FOUND);
    }

    // Check for child subcategories
    const childSubcategoriesCount = await SubCategory.countDocuments({ parentId: id, isDeleted: false });
    if (childSubcategoriesCount > 0) {
      return errorResponse(res, 400, `Cannot delete subcategory. It has ${childSubcategoriesCount} child subcategories associated with it.`);
    }

    // Check for associated active products
    const productsCount = await Product.countDocuments({ subcategoryId: id, isDeleted: false });
    if (productsCount > 0) {
      return errorResponse(res, 400, `Cannot delete subcategory. There are ${productsCount} active products associated with it.`);
    }

    // Hard delete the subcategory
    const result = await SubCategory.findByIdAndDelete(id);

    if (!result) {
      return errorResponse(res, 404, messages.SUBCATEGORY_NOT_FOUND);
    }

    // Clear relevant caches
    await cacheUtils.clearPattern('category_menu_structure_*');
    await cacheUtils.clearPattern('categories_*');
    await cacheUtils.del(`subcategory_${id}`);

    return successResponse(res, 200, messages.SUBCATEGORY_DELETED);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Export the functions
module.exports = {
  createSubcategory,
  getAllSubcategories,
  getSubcategoryById,
  updateSubcategoryById,
  toggleSubcategoryStatus,
  deleteSubcategoryById
};