const { Category, Product, SubCategory } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");
const { isValidId } = require("../utils/idUtils");
const slugify = require('slugify');
const { uploadToSpaces } = require("../middlewares/uploadMiddleware");
const { Op } = require('sequelize');

// Create a new category
const createCategory = async (req, res) => {
  try {
    const { name, description, isFeatured, metalIds } = req.body;

    if (!name) {
      return errorResponse(res, 400, "Category name is required");
    }

    const existingCategory = await Category.findOne({
      where: { name }
    });

    if (existingCategory) {
      return errorResponse(res, 409, "Category with this name already exists");
    }

    if (!req.file) {
      return errorResponse(res, 400, "Image is required");
    }

    const { buffer, originalname, mimetype } = req.file;
    const imageKey = await uploadToSpaces(buffer, originalname, mimetype);
    const slug = slugify(name, { lower: true, strict: true });

    const categoryData = {
      name,
      slug,
      description,
      image: imageKey,
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
      isActive: true
    };

    const category = await Category.create(categoryData);

    await cacheUtils.clearPattern('category_menu_structure_*');
    await cacheUtils.clearPattern('categories_*');

    return successResponse(res, 201, messages.CATEGORY_CREATED, { category });

  } catch (error) {
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
      search
    } = req.query;
    
    const cacheKey = `categories_admin_${page}_${limit}_${sortBy}_${sortOrder}_${search || ''}`;
    
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      return successResponse(res, 200, messages.CATEGORIES_RETRIEVED, cachedData);
    }
    
    const where = {};
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;
    
    const { count, rows: categories } = await Category.findAndCountAll({
      where,
      limit: parsedLimit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]]
    });
    
    const result = {
      categories,
      pagination: {
        total: count,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(count / parsedLimit)
      }
    };
    
    await cacheUtils.set(cacheKey, result, 300);
    
    return successResponse(res, 200, messages.CATEGORIES_RETRIEVED, result);

  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to retrieve categories");
  }
};

// Get active categories
const getActiveCategories = async (req, res) => {
  try {
    const { metalId } = req.query;
    const cacheKey = `categories_active_${metalId || 'all'}`;
    const cachedData = await cacheUtils.get(cacheKey);
    
    if (cachedData) {
      return successResponse(res, 200, messages.CATEGORIES_RETRIEVED, { categories: cachedData });
    }
    
    const categories = await Category.findAll({
      where: { isActive: true }
    });
    
    await cacheUtils.set(cacheKey, categories, 600);
    
    return successResponse(res, 200, messages.CATEGORIES_RETRIEVED, { categories });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to retrieve categories");
  }
};

// Get a category by ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidId(id)) {
      return errorResponse(res, 400, "Invalid category ID format");
    }
    
    const cacheKey = `category_${id}`;
    const cachedCategory = await cacheUtils.get(cacheKey);
    
    if (cachedCategory) {
      return successResponse(res, 200, messages.CATEGORY_RETRIEVED, { category: cachedCategory });
    }
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      return errorResponse(res, 404, messages.CATEGORY_NOT_FOUND);
    }
    
    await cacheUtils.set(cacheKey, category, 600);
    
    return successResponse(res, 200, messages.CATEGORY_RETRIEVED, { category });

  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to retrieve category");
  }
};

// Update a category by ID
const updateCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, metalIds } = req.body;
    let imageKey = null;
    if (req.file) {
      const { buffer, originalname, mimetype } = req.file;
      imageKey = await uploadToSpaces(buffer, originalname, mimetype);
    }
    
    if (!isValidId(id)) {
      return errorResponse(res, 400, "Invalid category ID format");
    }
    
    const category = await Category.findByPk(id);
    if (!category) {
      return errorResponse(res, 404, messages.CATEGORY_NOT_FOUND);
    }
    
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        where: { name, id: { [Op.ne]: id } }
      });
      
      if (existingCategory) {
        return errorResponse(res, 409, "Another category with this name already exists");
      }
      category.slug = slugify(name, { lower: true, strict: true });
      category.name = name;
    }
    
    if (description !== undefined) category.description = description;
    if (imageKey) {
      category.image = imageKey;
    } else if (image) {
      category.image = image;
    }
    
    await category.save();
    
    await cacheUtils.del(`category_${id}`);
    await cacheUtils.clearPattern('categories_*');
    await cacheUtils.clearPattern('category_menu_structure_*');
    
    return successResponse(res, 200, messages.CATEGORY_UPDATED, { category });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to update category");
  }
};

// Toggle category blocked status
const toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidId(id)) {
      return errorResponse(res, 400, "Invalid category ID format");
    }
    
    const category = await Category.findByPk(id);
    if (!category) {
      return errorResponse(res, 404, messages.CATEGORY_NOT_FOUND);
    }
    
    category.isActive = !category.isActive;
    await category.save();
    
    await cacheUtils.del(`category_${id}`);
    await cacheUtils.clearPattern('categories_*');
    await cacheUtils.clearPattern('category_menu_structure_*');
    
    return successResponse(res, 200, 
      category.isActive ? "Category activated successfully" : "Category deactivated successfully", 
      { category }
    );
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to update category status");
  }
};

// Delete a category by ID
const deleteCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidId(id)) {
      return errorResponse(res, 400, "Invalid category ID format");
    }
    
    const category = await Category.findByPk(id);
    if (!category) {
      return errorResponse(res, 404, messages.CATEGORY_NOT_FOUND);
    }
    
    const productsCount = await Product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      return errorResponse(res, 400, `Cannot delete category. ${productsCount} products are associated with this category`);
    }
    
    await category.destroy();
    
    await cacheUtils.del(`category_${id}`);
    await cacheUtils.clearPattern('categories_*');
    await cacheUtils.clearPattern('category_menu_structure_*');
    
    return successResponse(res, 200, messages.CATEGORY_DELETED);

  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to delete category");
  }
};

// Get category menu structure
const getCategoryMenu = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      include: [{ model: SubCategory }]
    });

    return successResponse(res, 200, "Category menu structure retrieved", categories);
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to retrieve category menu");
  }
};

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
