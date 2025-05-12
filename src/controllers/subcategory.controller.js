const { 
  create, 
  findOne, 
  findMany, 
  findAndUpdate, 
  deleteOne 
} = require('../services/mongodb/mongoService');

const { SubCategory, Category } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const mongoose = require('mongoose');

// Create a new subcategory
const createSubcategory = async (req, res) => {
  try {
    const { name, category, isFeatured } = req.body;
    
    // Basic validation
    if (!name) {
      return errorResponse(res, 400, "Subcategory name is required");
    }

    // Validate category ID if provided
    if (category && !mongoose.Types.ObjectId.isValid(category)) {
      return errorResponse(res, 400, "Invalid category ID format");
    }

    // Check if category exists if provided
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return errorResponse(res, 404, "Category not found");
      }
    }

    // Handle image
    const imageUrl = req.file?.originalname;
    if (!imageUrl) {
      return errorResponse(res, 400, "Image is required");
    }

    const subcategoryData = {
      name,
      category,
      images: imageUrl,
      isFeatured: isFeatured,
      isBlocked: false
    };

    const subcategory = await create(SubCategory, subcategoryData);
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
      category
    } = req.query;

    // Build query
    const query = {};
    
    if (isBlocked !== undefined) {
      query.isBlocked = isBlocked === 'true';
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (category) {
      query.category = category;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const populate = { path: 'category', select: 'name' };
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
    const { name, category, isBlocked, isFeatured } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid subcategory ID format");
    }

    // Validate category ID if provided
    if (category && !mongoose.Types.ObjectId.isValid(category)) {
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
    if (name) updateData.name = name;
    if (category) updateData.category = category;
    if (isBlocked !== undefined) updateData.isBlocked = isBlocked === 'true' || isBlocked === true;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured === 'true' || isFeatured === true;

    // Handle image update if provided
    if (req.file) {
      updateData.images = req.file.originalname;
    }

    const subcategory = await SubCategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('category', 'name');

    if (!subcategory) {
      return errorResponse(res, 404, messages.SUBCATEGORY_NOT_FOUND);
    }

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

    // Hard delete the subcategory
    const result = await SubCategory.findByIdAndDelete(id);

    if (!result) {
      return errorResponse(res, 404, messages.SUBCATEGORY_NOT_FOUND);
    }

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