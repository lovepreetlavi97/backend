const { 
  create, 
  findOne, 
  findMany, 
  findAndUpdate, 
  deleteOne 
} = require('../services/mongodb/mongoService');

const { PromoCode, Order } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");

// Create a new promo code
const createPromoCode = async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      minPurchase,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
      description,
      status = 'active'
    } = req.body;

    // Validate required fields
    if (!code || !type || !value || !maxDiscount || !startDate || !endDate || !usageLimit || !description) {
      return errorResponse(res, 400, "Missing required fields");
    }

    // Check if promo code already exists
    const existingPromoCode = await PromoCode.findOne({ 
      code: code.trim().toUpperCase(),
      isDeleted: false
    });

    if (existingPromoCode) {
      return errorResponse(res, 409, messages.error.promoCodeExists);
    }

    // Create new promo code
    const promoCodeData = {
      code: code.trim().toUpperCase(),
      type,
      value,
      minPurchase: minPurchase || 0,
      maxDiscount,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      usageLimit,
      description,
      status,
      usageCount: 0
    };

    const promoCode = await create(PromoCode, promoCodeData);

    // Clear cache
    await cacheUtils.delPattern('promo_codes_*');

    return successResponse(res, 201, messages.success.createPromocode, { promoCode });
  } catch (error) {
    console.error("Create promo code error:", error);
    return errorResponse(res, 500, error.message || messages.error.defaultError);
  }
};

// Get all promo codes with pagination and filters
const getAllPromoCodes = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      type
    } = req.query;

    // Create cache key
    const cacheKey = `promo_codes_${page}_${limit}_${search || ''}_${status || ''}_${type || ''}`;

    // Try to get from cache
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      return successResponse(res, 200, messages.success.getPromocodes, cachedData);
    }

    // Build query
    const query = { isDeleted: false };

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const promoCodes = await PromoCode.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await PromoCode.countDocuments(query);

    const result = {
      promoCodes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    };

    // Cache the result
    await cacheUtils.set(cacheKey, result, 300); // Cache for 5 minutes

    return successResponse(res, 200, messages.success.getPromocodes, result);
  } catch (error) {
    console.error("Get all promo codes error:", error);
    return errorResponse(res, 500, error.message || messages.error.defaultError);
  }
};

// Get a promo code by ID
const getPromoCodeById = async (req, res) => {
  try {
    const { id } = req.params;

    const promoCode = await findOne(PromoCode, { 
      _id: id,
      isDeleted: false
    });

    if (!promoCode) {
      return errorResponse(res, 404, messages.error.noPromoCodeFound);
    }

    return successResponse(res, 200, messages.success.getPromocode, { promoCode });
  } catch (error) {
    console.error("Get promo code error:", error);
    return errorResponse(res, 500, error.message || messages.error.defaultError);
  }
};

// Update a promo code
const updatePromoCodeById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if promo code exists
    const existingPromoCode = await PromoCode.findOne({ 
      _id: id,
      isDeleted: false
    });

    if (!existingPromoCode) {
      return errorResponse(res, 404, messages.error.noPromoCodeFound);
    }

    // If code is being updated, check for duplicates
    if (updateData.code && updateData.code !== existingPromoCode.code) {
      const duplicateCode = await PromoCode.findOne({
        code: updateData.code.trim().toUpperCase(),
        _id: { $ne: id },
        isDeleted: false
      });

      if (duplicateCode) {
        return errorResponse(res, 409, messages.error.promoCodeExists);
      }

      updateData.code = updateData.code.trim().toUpperCase();
    }

    // Update promo code
    const promoCode = await findAndUpdate(
      PromoCode,
      { _id: id },
      updateData
    );

    // Clear cache
    await cacheUtils.delPattern('promo_codes_*');

    return successResponse(res, 200, messages.success.updatePromocode, { promoCode });
  } catch (error) {
    console.error("Update promo code error:", error);
    return errorResponse(res, 500, error.message || messages.error.defaultError);
  }
};

// Delete a promo code (soft delete)
const deletePromoCodeById = async (req, res) => {
  try {
    const { id } = req.params;

    const promoCode = await findAndUpdate(
      PromoCode,
      { _id: id, isDeleted: false },
      { isDeleted: true, status: 'inactive' }
    );

    if (!promoCode) {
      return errorResponse(res, 404, messages.error.noPromoCodeFound);
    }

    // Clear cache
    await cacheUtils.delPattern('promo_codes_*');

    return successResponse(res, 200, messages.success.deletePromocode);
  } catch (error) {
    console.error("Delete promo code error:", error);
    return errorResponse(res, 500, error.message || messages.error.defaultError);
  }
};

// Toggle promo code status
const togglePromoCodeStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const promoCode = await PromoCode.findOne({ 
      _id: id,
      isDeleted: false
    });

    if (!promoCode) {
      return errorResponse(res, 404, messages.error.noPromoCodeFound);
    }

    // Toggle between active and inactive
    promoCode.status = promoCode.status === 'active' ? 'inactive' : 'active';
    await promoCode.save();

    // Clear cache
    await cacheUtils.delPattern('promo_codes_*');

    return successResponse(res, 200, messages.success.togglePromocode, { promoCode });
  } catch (error) {
    console.error("Toggle promo code status error:", error);
    return errorResponse(res, 500, error.message || messages.error.defaultError);
  }
};

// Validate a promo code
const validatePromoCode = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;

    if (!code || !cartTotal) {
      return errorResponse(res, 400, "Code and cart total are required");
    }

    const promoCode = await PromoCode.findOne({
      code: code.trim().toUpperCase(),
      status: 'active',
      isDeleted: false,
      startDate: { $lte: new Date() },
      endDate: { $gt: new Date() }
    });

    if (!promoCode) {
      return errorResponse(res, 404, messages.error.invalidPromoCode);
    }

    // Check minimum purchase requirement
    if (cartTotal < promoCode.minPurchase) {
      return errorResponse(res, 400, messages.error.minPurchaseNotMet);
    }

    // Check usage limit
    if (promoCode.usageCount >= promoCode.usageLimit) {
      return errorResponse(res, 400, messages.error.promoCodeLimitExceeded);
    }

    // Calculate discount
    let discountAmount = 0;
    if (promoCode.type === 'percentage') {
      discountAmount = (cartTotal * promoCode.value) / 100;
      if (discountAmount > promoCode.maxDiscount) {
        discountAmount = promoCode.maxDiscount;
      }
    } else {
      discountAmount = promoCode.value;
    }

    return successResponse(res, 200, messages.success.validatePromocode, {
      promoCode: {
        ...promoCode.toObject(),
        discountAmount
      }
    });
  } catch (error) {
    console.error("Validate promo code error:", error);
    return errorResponse(res, 500, error.message || messages.error.defaultError);
  }
};

// Get promo code analytics
const getPromoCodeAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const promoCode = await PromoCode.findOne({ 
      _id: id,
      isDeleted: false
    });

    if (!promoCode) {
      return errorResponse(res, 404, messages.error.noPromoCodeFound);
    }

    // Get orders where this promo code was used
    const orders = await Order.find({
      'promoCode': id,
      'status': { $in: ['Delivered', 'Completed'] }
    }).select('finalAmount discountAmount createdAt');

    // Calculate analytics
    const analytics = {
      totalUsage: promoCode.usageCount || 0,
      remainingUsage: promoCode.usageLimit - (promoCode.usageCount || 0),
      totalDiscount: orders.reduce((sum, order) => sum + (order.discountAmount || 0), 0),
      averageDiscount: orders.length > 0 
        ? orders.reduce((sum, order) => sum + (order.discountAmount || 0), 0) / orders.length 
        : 0,
      totalRevenue: orders.reduce((sum, order) => sum + order.finalAmount, 0),
      usageByMonth: {},
      status: promoCode.status,
      isExpired: new Date() > new Date(promoCode.endDate),
      daysRemaining: Math.max(0, Math.ceil((new Date(promoCode.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
    };

    // Calculate usage by month
    orders.forEach(order => {
      const monthYear = new Date(order.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!analytics.usageByMonth[monthYear]) {
        analytics.usageByMonth[monthYear] = {
          count: 0,
          discount: 0,
          revenue: 0
        };
      }
      analytics.usageByMonth[monthYear].count++;
      analytics.usageByMonth[monthYear].discount += order.discountAmount || 0;
      analytics.usageByMonth[monthYear].revenue += order.finalAmount;
    });

    return successResponse(res, 200, messages.success.defaultMessage, { analytics });
  } catch (error) {
    console.error("Get promo code analytics error:", error);
    return errorResponse(res, 500, error.message || messages.error.defaultError);
  }
};

module.exports = {
  createPromoCode,
  getAllPromoCodes,
  getPromoCodeById,
  updatePromoCodeById,
  deletePromoCodeById,
  validatePromoCode,
  togglePromoCodeStatus,
  getPromoCodeAnalytics
};
