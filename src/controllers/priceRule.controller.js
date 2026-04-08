const { 
  create, 
  findOne, 
  findMany, 
  findAndUpdate 
} = require('../services/mongodb/mongoService');

const PriceRule = require('../models/priceRule.model');
const Product = require('../models/product.model');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const { cacheUtils } = require("../config/redis");

// Create Price Rule
const createPriceRule = async (req, res) => {
  try {
    const { name, price, isActive = true } = req.body;

    if (!name || price === undefined) {
      return errorResponse(res, 400, "Name and price are required");
    }

    const existing = await PriceRule.findOne({ name: name.trim(), isDeleted: false });
    if (existing) {
      return errorResponse(res, 409, "Price rule with this name already exists");
    }

    const priceRule = await create(PriceRule, { name: name.trim(), price, isActive });

    await cacheUtils.delPattern('price-rules_*');

    return successResponse(res, 201, "Price rule created successfully", { priceRule });
  } catch (error) {
    console.error("Create price rule error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Get All Price Rules
const getAllPriceRules = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const cacheKey = `price-rules_${page}_${limit}_${search}_${isActive || ''}`;
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      return successResponse(res, 200, "Price rules retrieved successfully", cachedData);
    }

    const query = { isDeleted: false };
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const priceRules = await PriceRule.find(query)
      .sort(sort)
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();

    const total = await PriceRule.countDocuments(query);

    const result = {
      priceRules,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    };

    await cacheUtils.set(cacheKey, result, 300); // 5 min cache

    return successResponse(res, 200, "Price rules retrieved successfully", result);
  } catch (error) {
    console.error("Get all price rules error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Get by ID
const getPriceRuleById = async (req, res) => {
  try {
    const { id } = req.params;

    const priceRule = await findOne(PriceRule, { _id: id, isDeleted: false });

    if (!priceRule) {
      return errorResponse(res, 404, "Price rule not found");
    }

    return successResponse(res, 200, "Price rule retrieved successfully", { priceRule });
  } catch (error) {
    console.error("Get price rule error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Update by ID
const updatePriceRuleById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, isActive } = req.body;

    const existing = await PriceRule.findOne({ _id: id, isDeleted: false });
    if (!existing) {
      return errorResponse(res, 404, "Price rule not found");
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (price !== undefined) updateData.price = price;
    if (isActive !== undefined) updateData.isActive = isActive;

    const priceRule = await findAndUpdate(PriceRule, { _id: id }, updateData);

    await cacheUtils.delPattern('price-rules_*');

    return successResponse(res, 200, "Price rule updated successfully", { priceRule });
  } catch (error) {
    console.error("Update price rule error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Soft Delete by ID
const deletePriceRuleById = async (req, res) => {
  try {
    const { id } = req.params;

    const priceRule = await PriceRule.findOne({ _id: id, isDeleted: false });
    if (!priceRule) {
      return errorResponse(res, 404, "Price rule not found");
    }

    // Dependency check: check if any active products are using this price rule
    const inUse = await Product.exists({ priceRuleId: id, isDeleted: false });
    if (inUse) {
      return errorResponse(res, 400, "Cannot delete price rule. It is currently being used by one or more active products.");
    }

    await findAndUpdate(PriceRule, { _id: id }, { isDeleted: true });

    await cacheUtils.delPattern('price-rules_*');

    return successResponse(res, 200, "Price rule deleted successfully");
  } catch (error) {
    console.error("Delete price rule error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Toggle isActive
const togglePriceRuleStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const priceRule = await PriceRule.findOne({ _id: id, isDeleted: false });
    if (!priceRule) {
      return errorResponse(res, 404, "Price rule not found");
    }

    const updated = await findAndUpdate(
      PriceRule,
      { _id: id },
      { isActive: !priceRule.isActive }
    );

    await cacheUtils.delPattern('price-rules_*');

    return successResponse(res, 200, "Price rule status toggled successfully", { priceRule: updated });
  } catch (error) {
    console.error("Toggle status error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

module.exports = {
  createPriceRule,
  getAllPriceRules,
  getPriceRuleById,
  updatePriceRuleById,
  deletePriceRuleById,
  togglePriceRuleStatus,
};
