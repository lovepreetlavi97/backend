const { 
  create, 
  findOne, 
  findMany, 
  findAndUpdate, 
  deleteOne 
} = require('../services/mongodb/mongoService');

const Banner = require('../models/banner.model');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const { cacheUtils } = require("../config/redis");
const path = require('path');
const fs = require('fs');
const { uploadToSpaces } = require("../middlewares/uploadMiddleware"); 
const mongoose = require('mongoose');
/**
 * Create a new banner
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createBanner = async (req, res) => {
  try {
    const {
      title,
      description,
      type = 'home',
      link = '',
      startDate,
      endDate,
      status = 'active',
      position,
      metalIds,
      buttonText,
      subtitle
    } = req.body;
    console.log(`Creating banner with metalIds: "${metalIds}" (type: ${typeof metalIds})`);

    // Validate required fields
    if (!title || !description || !startDate || !endDate) {
      return errorResponse(res, 400, "Missing required fields");
    }

    let parsedMetalIds = [];
    if (Array.isArray(metalIds)) {
      parsedMetalIds = metalIds;
    } else if (typeof metalIds === 'string' && metalIds.trim() !== '') {
      if (metalIds.startsWith('[') && metalIds.endsWith(']')) {
        try {
          parsedMetalIds = JSON.parse(metalIds);
        } catch (e) {
          parsedMetalIds = [metalIds];
        }
      } else {
        parsedMetalIds = [metalIds];
      }
    }

    // Create banner data object
    const bannerData = {
      title,
      description,
      type,
      link,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status,
      metalIds: parsedMetalIds,
      buttonText,
      subtitle
    };

    // Handle position
    if (position) {
      bannerData.position = parseInt(position);
    } else {
      // If no position provided, get the highest position and add 1
      const highestPositionBanner = await Banner.findOne({
        isDeleted: false
      }).sort({ position: -1 }).limit(1);
      
      bannerData.position = highestPositionBanner ? highestPositionBanner.position + 1 : 1;
    }

// Handle image upload
if (!req.file) {
  return errorResponse(res, 400, "Image is required");
}

const { buffer, originalname, mimetype } = req.file;
const imageKey = await uploadToSpaces(buffer, originalname, mimetype);
if (imageKey) {
  bannerData.imageUrl = imageKey;
}

    // Create the banner
    const banner = await create(Banner, bannerData);

    // Clear cache
    await cacheUtils.delPattern('banners_*');

    return successResponse(res, 201, "Banner created successfully", { banner });
  } catch (error) {
    console.error("Create banner error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

/**
 * Get all banners with pagination and filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllBanners = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      status,
      sortBy = 'position',
      sortOrder = 'asc',
      metalId
    } = req.query;

    // Create cache key
    const cacheKey = `banners_${page}_${limit}_${search || ''}_${type || ''}_${status || ''}_${metalId || ''}`;

    // Try to get from cache
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      return successResponse(res, 200, "Banners retrieved successfully", cachedData);
    }

    // Build query
    const query = { isDeleted: false };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    if (metalId && mongoose.Types.ObjectId.isValid(metalId)) {
      query.metalIds = { $in: [new mongoose.Types.ObjectId(metalId)] };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort configuration
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const banners = await Banner.find(query)
      .populate('metalIds', 'name slug colorCode')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Banner.countDocuments(query);

    const result = {
      banners,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    };

    // Cache the result
    await cacheUtils.set(cacheKey, result, 300); // Cache for 5 minutes

    return successResponse(res, 200, "Banners retrieved successfully", result);
  } catch (error) {
    console.error("Get all banners error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

/**
 * Get a banner by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await findOne(Banner, { 
      _id: id,
      isDeleted: false
    });

    if (!banner) {
      return errorResponse(res, 404, "Banner not found");
    }

    return successResponse(res, 200, "Banner retrieved successfully", { banner });
  } catch (error) {
    console.error("Get banner error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

/**
 * Update a banner by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Check if banner exists
    const existingBanner = await Banner.findOne({ 
      _id: id,
      isDeleted: false
    });

    if (!existingBanner) {
      return errorResponse(res, 404, "Banner not found");
    }

    // Convert date strings to Date objects
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }

    if (updateData.metalIds) {
      if (typeof updateData.metalIds === 'string' && updateData.metalIds.startsWith('[') && updateData.metalIds.endsWith(']')) {
        try {
          updateData.metalIds = JSON.parse(updateData.metalIds);
        } catch (e) {
          updateData.metalIds = [updateData.metalIds];
        }
      } else if (typeof updateData.metalIds === 'string' && updateData.metalIds.trim() !== '') {
        updateData.metalIds = [updateData.metalIds];
      }
    }

    if (req.file) {
  const { buffer, originalname, mimetype } = req.file;
  const imageKey = await uploadToSpaces(buffer, originalname, mimetype);
  updateData.imageUrl = imageKey;
}

    // Update banner
    const banner = await findAndUpdate(
      Banner,
      { _id: id },
      updateData
    );

    // Clear cache
    await cacheUtils.delPattern('banners_*');
    await cacheUtils.delPattern('banners_user_*');

    return successResponse(res, 200, "Banner updated successfully", { banner });
  } catch (error) {
    console.error("Update banner error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

/**
 * Delete a banner by ID (Hard delete to avoid unique slug collisions)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteBannerById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if banner exists
    const banner = await Banner.findOne({ 
      _id: id
    });

    if (!banner) {
      return errorResponse(res, 404, "Banner not found");
    }

    // Hard delete completely from the database
    await Banner.findByIdAndDelete(id);

    // Clear cache
    await cacheUtils.delPattern('banners_*');
    await cacheUtils.delPattern('banners_user_*');

    return successResponse(res, 200, "Banner deleted successfully");
  } catch (error) {
    console.error("Delete banner error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

/**
 * Toggle banner status (active/inactive)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if banner exists
    const banner = await Banner.findOne({ 
      _id: id,
      isDeleted: false
    });

    if (!banner) {
      return errorResponse(res, 404, "Banner not found");
    }

    // Toggle status between active and inactive
    const newStatus = banner.status === 'active' ? 'inactive' : 'active';

    // Update banner status
    const updatedBanner = await findAndUpdate(
      Banner,
      { _id: id },
      { status: newStatus }
    );

    // Clear cache
    await cacheUtils.delPattern('banners_*');
    await cacheUtils.delPattern('banners_user_*');

    return successResponse(
      res, 
      200, 
      `Banner ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 
      { banner: updatedBanner }
    );
  } catch (error) {
    console.error("Toggle banner status error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

/**
 * Update banner position
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateBannerPosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body;

    if (!direction || !['up', 'down'].includes(direction)) {
      return errorResponse(res, 400, "Invalid direction. Must be 'up' or 'down'");
    }

    // Get the current banner
    const currentBanner = await Banner.findOne({ 
      _id: id,
      isDeleted: false
    });

    if (!currentBanner) {
      return errorResponse(res, 404, "Banner not found");
    }

    // Find the adjacent banner based on direction
    const sortDirection = direction === 'up' ? -1 : 1;
    const positionQuery = direction === 'up' 
      ? { position: { $lt: currentBanner.position } }
      : { position: { $gt: currentBanner.position } };

    const adjacentBanner = await Banner.findOne({
      ...positionQuery,
      isDeleted: false,
      type: currentBanner.type // Only swap positions with banners of the same type
    }).sort({ position: sortDirection }).limit(1);

    if (!adjacentBanner) {
      return errorResponse(res, 400, `Cannot move banner ${direction}. It's already at the ${direction === 'up' ? 'top' : 'bottom'}`);
    }

    // Swap positions
    const tempPosition = currentBanner.position;
    currentBanner.position = adjacentBanner.position;
    adjacentBanner.position = tempPosition;

    // Save both banners
    await currentBanner.save();
    await adjacentBanner.save();

    // Clear cache
    await cacheUtils.delPattern('banners_*');
    await cacheUtils.delPattern('banners_user_*');

    return successResponse(res, 200, "Banner position updated successfully");
  } catch (error) {
    console.error("Update banner position error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Export the functions
module.exports = {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBannerById,
  deleteBannerById,
  toggleBannerStatus,
  updateBannerPosition
};
