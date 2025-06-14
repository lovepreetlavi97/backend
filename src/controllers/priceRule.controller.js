const { 
  create, 
  findOne, 
  findMany, 
  findAndUpdate, 
  deleteOne 
} = require('../services/mongodb/mongoService');

const { PriceRule } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");

// Create a new price rule
const createPriceRule = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      value,
      categoryId,
      subcategoryId,
      productId,
      minOrderValue,
      startDate,
      endDate,
      isActive = true
    } = req.body;

    // Validate required fields
    if (!name || !description || !type || !value) {
      return errorResponse(res, 400, "Missing required fields");
    }

    // Create new price rule
    const priceRuleData = {
      name,
      description,
      type,
      value,
      minOrderValue: minOrderValue || 0,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      isActive
    };
    
    // Only add IDs if they're not empty strings
    if (categoryId && categoryId.trim() !== '') {
      priceRuleData.categoryId = categoryId;
    }
    
    if (subcategoryId && subcategoryId.trim() !== '') {
      priceRuleData.subcategoryId = subcategoryId;
    }
    
    if (productId && productId.trim() !== '') {
      priceRuleData.productId = productId;
    }

    const priceRule = await create(PriceRule, priceRuleData);

    // Clear cache
    await cacheUtils.delPattern('price_rules_*');

    return successResponse(res, 201, "Price rule created successfully", { priceRule });
  } catch (error) {
    console.error("Create price rule error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Get all price rules with pagination and filters
const getAllPriceRules = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      type,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Create cache key
    const cacheKey = `price_rules_${page}_${limit}_${search || ''}_${type || ''}_${isActive || ''}`;

    // Try to get from cache
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      return successResponse(res, 200, "Price rules retrieved successfully", cachedData);
    }

    // Build query
    const query = { isDeleted: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (type) {
      query.type = type;
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
    const priceRules = await PriceRule.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await PriceRule.countDocuments(query);

    const result = {
      priceRules,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    };

    // Cache the result
    await cacheUtils.set(cacheKey, result, 300); // Cache for 5 minutes

    return successResponse(res, 200, "Price rules retrieved successfully", result);
  } catch (error) {
    console.error("Get all price rules error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Get a price rule by ID
const getPriceRuleById = async (req, res) => {
  try {
    const { id } = req.params;

    const priceRule = await findOne(PriceRule, { 
      _id: id,
      isDeleted: false
    });

    if (!priceRule) {
      return errorResponse(res, 404, "Price rule not found");
    }

    return successResponse(res, 200, "Price rule retrieved successfully", { priceRule });
  } catch (error) {
    console.error("Get price rule error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Update a price rule
const updatePriceRuleById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Check if price rule exists
    const existingPriceRule = await PriceRule.findOne({ 
      _id: id,
      isDeleted: false
    });

    if (!existingPriceRule) {
      return errorResponse(res, 404, "Price rule not found");
    }

    // Process dates if they exist
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }
    
    // Handle empty string IDs
    if (updateData.categoryId === '') {
      delete updateData.categoryId;
    }
    
    if (updateData.subcategoryId === '') {
      delete updateData.subcategoryId;
    }
    
    if (updateData.productId === '') {
      delete updateData.productId;
    }

    // Update price rule
    const priceRule = await findAndUpdate(
      PriceRule,
      { _id: id },
      updateData
    );

    // Clear cache
    await cacheUtils.delPattern('price_rules_*');

    return successResponse(res, 200, "Price rule updated successfully", { priceRule });
  } catch (error) {
    console.error("Update price rule error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Delete a price rule (soft delete)
const deletePriceRuleById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if price rule exists
    const existingPriceRule = await PriceRule.findOne({ 
      _id: id,
      isDeleted: false
    });

    if (!existingPriceRule) {
      return errorResponse(res, 404, "Price rule not found");
    }

    // Soft delete by setting isDeleted to true
    await findAndUpdate(PriceRule, { _id: id }, { isDeleted: true });

    // Clear cache
    await cacheUtils.delPattern('price_rules_*');

    return successResponse(res, 200, "Price rule deleted successfully");
  } catch (error) {
    console.error("Delete price rule error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Toggle price rule status
const togglePriceRuleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if price rule exists
    const existingPriceRule = await PriceRule.findOne({ 
      _id: id,
      isDeleted: false
    });

    if (!existingPriceRule) {
      return errorResponse(res, 404, "Price rule not found");
    }

    // Toggle isActive status
    const updatedPriceRule = await findAndUpdate(
      PriceRule,
      { _id: id },
      { isActive: !existingPriceRule.isActive }
    );

    // Clear cache
    await cacheUtils.delPattern('price_rules_*');

    return successResponse(res, 200, "Price rule status toggled successfully", { priceRule: updatedPriceRule });
  } catch (error) {
    console.error("Toggle price rule status error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

module.exports = {
  createPriceRule,
  getAllPriceRules,
  getPriceRuleById,
  updatePriceRuleById,
  deletePriceRuleById,
  togglePriceRuleStatus
};
