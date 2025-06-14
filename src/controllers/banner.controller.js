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
      position
    } = req.body;

    // Validate required fields
    if (!title || !description || !startDate || !endDate) {
      return errorResponse(res, 400, "Missing required fields");
    }

    // Create banner data object
    const bannerData = {
      title,
      description,
      type,
      link,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status
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

    // Handle image upload if present
    if (req.file) {
      // For S3 uploads, use the location property
      if (req.file.location) {
        bannerData.imageUrl = req.file.location;
      } 
      // For local uploads, format the path
      else if (req.file.path) {
        bannerData.imageUrl = req.file.path.replace(/\\\\/g, '/').split('public/')[1];
      }
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
      sortOrder = 'asc'
    } = req.query;

    // Create cache key
    const cacheKey = `banners_${page}_${limit}_${search || ''}_${type || ''}_${status || ''}`;

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

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort configuration
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const banners = await Banner.find(query)
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

    // Handle position if provided
    if (updateData.position) {
      updateData.position = parseInt(updateData.position);
    }

    // Handle image upload if present
    if (req.file) {
      // For S3 uploads, use the location property
      if (req.file.location) {
        updateData.imageUrl = req.file.location;
      } 
      // For local uploads, format the path
      else if (req.file.path) {
        updateData.imageUrl = req.file.path.replace(/\\\\/g, '/').split('public/')[1];
      }
    }

    // Update banner
    const banner = await findAndUpdate(
      Banner,
      { _id: id },
      updateData
    );

    // Clear cache
    await cacheUtils.delPattern('banners_*');

    return successResponse(res, 200, "Banner updated successfully", { banner });
  } catch (error) {
    console.error("Update banner error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

/**
 * Delete a banner by ID (soft delete)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteBannerById = async (req, res) => {
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

    // Soft delete by updating isDeleted flag
    await findAndUpdate(
      Banner,
      { _id: id },
      { isDeleted: true }
    );

    // Clear cache
    await cacheUtils.delPattern('banners_*');

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
