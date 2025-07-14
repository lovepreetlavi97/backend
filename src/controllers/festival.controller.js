const {
  create,
  findOne,
  findMany,
  findAndUpdate,
  deleteOne
} = require('../services/mongodb/mongoService');
const { Festival } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");
const path = require('path');
const fs = require('fs');
const { uploadToSpaces } = require("../middlewares/uploadMiddleware"); 
// Create a new festival
const createFestival = async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      isActive = true
    } = req.body;

    // Validate required fields
    if (!name || !description || !startDate || !endDate) {
      return errorResponse(res, 400, "Missing required fields");
    }

    // Create festival data object
    const festivalData = {
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive === 'true' || isActive === true
    };


    // Handle image
    if (!req.file) {
      return errorResponse(res, 400, "Image is required");
    }

    const { buffer, originalname, mimetype } = req.file;
    const imageKey = await uploadToSpaces(buffer, originalname, mimetype);
if (imageKey){
  festivalData.image = imageKey
}
    // Create the festival
    const festival = await create(Festival, festivalData);

    // Clear cache
    await cacheUtils.delPattern('festivals_*');

    return successResponse(res, 201, "Festival created successfully", { festival });
  } catch (error) {
    console.error("Create festival error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Get all festivals with pagination and filters
const getAllFestivals = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Create cache key
    const cacheKey = `festivals_${page}_${limit}_${search || ''}_${isActive || ''}`;

    // Try to get from cache
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      return successResponse(res, 200, "Festivals retrieved successfully", cachedData);
    }

    // Build query
    const query = { isDeleted: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort configuration
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const festivals = await Festival.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Festival.countDocuments(query);

    const result = {
      festivals,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    };

    // Cache the result
    await cacheUtils.set(cacheKey, result, 300); // Cache for 5 minutes

    return successResponse(res, 200, "Festivals retrieved successfully", result);
  } catch (error) {
    console.error("Get all festivals error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Get a festival by ID
const getFestivalById = async (req, res) => {
  try {
    const { id } = req.params;

    const festival = await findOne(Festival, { 
      _id: id,
      isDeleted: false
    });

    if (!festival) {
      return errorResponse(res, 404, "Festival not found");
    }

    return successResponse(res, 200, "Festival retrieved successfully", { festival });
  } catch (error) {
    console.error("Get festival error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};
// Update a festival by ID
const updateFestivalById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Check if festival exists
    const existingFestival = await Festival.findOne({ 
      _id: id,
      isDeleted: false
    });

    if (!existingFestival) {
      return errorResponse(res, 404, "Festival not found");
    }

    // Process dates if they exist
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    // Handle isActive conversion if it's a string
    if (updateData.isActive !== undefined) {
      updateData.isActive = updateData.isActive === 'true' || updateData.isActive === true;
    }

    if (req.file) {
      const { buffer, originalname, mimetype } = req.file;
      const imageKey = await uploadToSpaces(buffer, originalname, mimetype);
      updateData.image = imageKey;
    }

    // Update festival
    const festival = await findAndUpdate(
      Festival,
      { _id: id },
      updateData
    );

    // Clear cache
    await cacheUtils.delPattern('festivals_*');

    return successResponse(res, 200, "Festival updated successfully", { festival });
  } catch (error) {
    console.error("Update festival error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};



// Delete a festival by ID (soft delete)
const deleteFestivalById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if festival exists
    const existingFestival = await Festival.findOne({ 
      _id: id,
      isDeleted: false
    });

    if (!existingFestival) {
      return errorResponse(res, 404, "Festival not found");
    }

    // Soft delete by setting isDeleted to true
    await findAndUpdate(Festival, { _id: id }, { isDeleted: true });

    // Clear cache
    await cacheUtils.delPattern('festivals_*');

    return successResponse(res, 200, "Festival deleted successfully");
  } catch (error) {
    console.error("Delete festival error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Toggle festival status
const toggleFestivalStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if festival exists
    const existingFestival = await Festival.findOne({ 
      _id: id,
      isDeleted: false
    });

    if (!existingFestival) {
      return errorResponse(res, 404, "Festival not found");
    }

    // Toggle isActive status
    const updatedFestival = await findAndUpdate(
      Festival,
      { _id: id },
      { isActive: !existingFestival.isActive }
    );

    // Clear cache
    await cacheUtils.delPattern('festivals_*');

    return successResponse(res, 200, "Festival status toggled successfully", { festival: updatedFestival });
  } catch (error) {
    console.error("Toggle festival status error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Export all functions
module.exports = {
  createFestival,
  getAllFestivals,
  getFestivalById,
  updateFestivalById,
  deleteFestivalById,
  toggleFestivalStatus
};