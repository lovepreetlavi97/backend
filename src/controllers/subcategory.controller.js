const { 
  create, 
  findOne, 
  findMany, 
  findAndUpdate, 
  deleteOne 
} = require('../services/mongodb/mongoService');

const { SubCategory } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");

// Create a new subcategory
const createSubcategory = async (req, res) => {
  try {
      const subcategoryData = req.body;
      
    const imageUrls = req.files.map((file) => file.location);
      if (imageUrls.length === 0) {
        return errorResponse(res, 400, "One image is required");
      }
      subcategoryData.images = imageUrls
      const subcategory = await create(SubCategory, subcategoryData);
      return successResponse(res, 201, messages.SUBCATEGORY_CREATED, { subcategory });
  } catch (error) {
      return errorResponse(res, 400, error.message);
  }
};

// Get all subcategories
const getAllSubcategories = async (req, res) => {
  try {
      const populate = { path: 'category', select: 'name' };
      const subcategories = await findMany(SubCategory, {}, {}, {}, populate);

      if (!subcategories.length) {
          return errorResponse(res, 404, messages.SUBCATEGORIES_NOT_FOUND);
      }

      return successResponse(res, 200, messages.SUBCATEGORIES_RETRIEVED, { subcategories });

  } catch (error) {
      return errorResponse(res, 500, error.message);
  }
};

// Get a subcategory by ID
const getSubcategoryById = async (req, res) => {
  try {
      const subcategory = await findOne(SubCategory, { _id: req.params.id });

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
    // Safely handle image uploads
    const imageUrls = req.files?.map((file) => file.location) || [];
    const subcategoryData = { ...req.body };

    // Only update imageUrls if new images are provided
    if (imageUrls.length === 0) {
      console.log("No new images provided, images will not be updated.");
      delete subcategoryData.images; // Prevent updating images if none provided
    } else {
      subcategoryData.images = imageUrls; // Update images if new ones exist
    }

    // Find and update the subcategory by ID
    const subcategory = await findAndUpdate(SubCategory, { _id: req.params.id }, subcategoryData);

    if (!subcategory) {
      return errorResponse(res, 404, messages.SUBCATEGORY_NOT_FOUND);
    }

    return successResponse(res, 200, messages.SUBCATEGORY_UPDATED, { subcategory });

  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};


// Delete a subcategory by ID
const deleteSubcategoryById = async (req, res) => {
  try {
      const result = await deleteOne(SubCategory, { _id: req.params.id });

      if (result.deletedCount === 0) {
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
  deleteSubcategoryById,
};