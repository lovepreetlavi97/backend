const { 
  create, 
  findOne, 
  findMany, 
  findAndUpdate, 
  deleteOne 
} = require('../services/mongodb/mongoService');

const { Relation } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");
const path = require('path');
const fs = require('fs');

// Create a new relation
const createRelation = async (req, res) => {
  try {
    const {
      name,
      description,
      isActive = true
    } = req.body;

    // Validate required fields
    if (!name || !description) {
      return errorResponse(res, 400, "Missing required fields");
    }

    // Create relation data object
    const relationData = {
      name,
      description,
      isActive: isActive === 'true' || isActive === true
    };

    // Handle icon upload if present
    if (req.file) {
      // For S3 uploads, use the location property
      if (req.file.location) {
        relationData.icon = req.file.location;
      } 
      // For local uploads, format the path
      else if (req.file.path) {
        relationData.icon = req.file.path.replace(/\\/g, '/').split('public/')[1];
      }
    }

    // Create the relation
    const relation = await create(Relation, relationData);

    // Clear cache
    await cacheUtils.delPattern('relations_*');

    return successResponse(res, 201, "Relation created successfully", { relation });
  } catch (error) {
    console.error("Create relation error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Get all relations with pagination and filters
const getAllRelations = async (req, res) => {
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
    const cacheKey = `relations_${page}_${limit}_${search || ''}_${isActive || ''}`;

    // Try to get from cache
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      return successResponse(res, 200, "Relations retrieved successfully", cachedData);
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
    const relations = await Relation.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Relation.countDocuments(query);

    const result = {
      relations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    };

    // Cache the result
    await cacheUtils.set(cacheKey, result, 300); // Cache for 5 minutes

    return successResponse(res, 200, "Relations retrieved successfully", result);
  } catch (error) {
    console.error("Get all relations error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Get a relation by ID
const getRelationById = async (req, res) => {
  try {
    const { id } = req.params;

    const relation = await findOne(Relation, { 
      _id: id,
      isDeleted: false
    });

    if (!relation) {
      return errorResponse(res, 404, "Relation not found");
    }

    return successResponse(res, 200, "Relation retrieved successfully", { relation });
  } catch (error) {
    console.error("Get relation error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};
// Update a relation by ID
const updateRelationById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Check if relation exists
    const existingRelation = await Relation.findOne({ 
      _id: id,
      isDeleted: false
    });

    if (!existingRelation) {
      return errorResponse(res, 404, "Relation not found");
    }

    // Handle isActive conversion if it's a string
    if (updateData.isActive !== undefined) {
      updateData.isActive = updateData.isActive === 'true' || updateData.isActive === true;
    }

    // Handle icon upload if present
    if (req.file) {
      // For S3 uploads, use the location property
      if (req.file.location) {
        updateData.icon = req.file.location;
      } 
      // For local uploads, format the path
      else if (req.file.path) {
        updateData.icon = req.file.path.replace(/\\/g, '/').split('public/')[1];
      }
    }

    // Update relation
    const relation = await findAndUpdate(
      Relation,
      { _id: id },
      updateData
    );

    // Clear cache
    await cacheUtils.delPattern('relations_*');

    return successResponse(res, 200, "Relation updated successfully", { relation });
  } catch (error) {
    console.error("Update relation error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Delete a relation by ID (soft delete)
const deleteRelationById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if relation exists
    const relation = await Relation.findOne({ 
      _id: id,
      isDeleted: false
    });

    if (!relation) {
      return errorResponse(res, 404, "Relation not found");
    }

    // Soft delete by updating isDeleted flag
    await findAndUpdate(
      Relation,
      { _id: id },
      { isDeleted: true }
    );

    // Clear cache
    await cacheUtils.delPattern('relations_*');

    return successResponse(res, 200, "Relation deleted successfully");
  } catch (error) {
    console.error("Delete relation error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Toggle relation active status
const toggleRelationStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if relation exists
    const relation = await Relation.findOne({ 
      _id: id,
      isDeleted: false
    });

    if (!relation) {
      return errorResponse(res, 404, "Relation not found");
    }

    // Toggle isActive status
    const updatedRelation = await findAndUpdate(
      Relation,
      { _id: id },
      { isActive: !relation.isActive }
    );

    // Clear cache
    await cacheUtils.delPattern('relations_*');

    return successResponse(
      res, 
      200, 
      `Relation ${updatedRelation.isActive ? 'activated' : 'deactivated'} successfully`, 
      { relation: updatedRelation }
    );
  } catch (error) {
    console.error("Toggle relation status error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Export the functions
module.exports = {
  createRelation,
  getAllRelations,
  getRelationById,
  updateRelationById,
  deleteRelationById,
  toggleRelationStatus
};