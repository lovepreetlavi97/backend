const { 
  create, 
  findOne, 
  findMany, 
  findAndUpdate, 
  deleteOne 
} = require('../services/mongodb/mongoService');

const { PromoCode } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");

const createPromoCode = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      maxDiscount,
      minOrderValue,
      startDate,
      expiryDate,
      usageLimit,
      isActive = true,
    } = req.body;

    // Check required fields
    if (!code || !discountType || typeof discountValue !== "number" || !expiryDate) {
      return errorResponse(res, 400, "Missing required fields: code, discountType, discountValue, expiryDate");
    }

    const promoExists = await PromoCode.findOne({ code: code.trim().toUpperCase() });
    if (promoExists) {
      return errorResponse(res, 400, "Promo code already exists");
    }

    const promoCode = new PromoCode({
      code: code.trim().toUpperCase(),
      discountType,
      discountValue,
      maxDiscount: maxDiscount || null,
      minOrderValue: minOrderValue || 0,
      startDate: startDate || Date.now(),
      expiryDate,
      usageLimit: usageLimit || null,
      isActive,
      usedCount: 0,
      usedBy: [],
      userRestrictions: [],
    });

    await promoCode.save();

    return successResponse(res, 200,messages.PROMO_CODE_CREATED, { promoCode });
  } catch (error) {
    return errorResponse(res,500, error.message);
  }
};



// Get all promo codes
const getAllPromoCodes = async (req, res) => {
  try {
      const promoCodes = await findMany(PromoCode);

      if (!promoCodes.length) {
          return errorResponse(res, messages.PROMO_CODES_NOT_FOUND, 404);
      }

      return successResponse(res, messages.PROMO_CODES_RETRIEVED, { promoCodes });

  } catch (error) {
      return errorResponse(res, error.message);
  }
};

// Get a promo code by ID
const getPromoCodeById = async (req, res) => {
  try {
      const promoCode = await findOne(PromoCode, { _id: req.params.id });

      if (!promoCode) {
          return errorResponse(res, messages.PROMO_CODE_NOT_FOUND, 404);
      }

      return successResponse(res, messages.PROMO_CODE_RETRIEVED, { promoCode });

  } catch (error) {
      return errorResponse(res, error.message);
  }
};

// Update a promo code by ID
const updatePromoCodeById = async (req, res) => {
  try {
      const promoCodeData = req.body;

      const promoCode = await findAndUpdate(PromoCode, { _id: req.params.id }, promoCodeData);

      if (!promoCode) {
          return errorResponse(res, messages.PROMO_CODE_NOT_FOUND, 404);
      }

      return successResponse(res, messages.PROMO_CODE_UPDATED, { promoCode });

  } catch (error) {
      return errorResponse(res, error.message);
  }
};

// Delete a promo code by ID
const deletePromoCodeById = async (req, res) => {
  try {
      const result = await deleteOne(PromoCode, { _id: req.params.id });

      if (result.deletedCount === 0) {
          return errorResponse(res, messages.PROMO_CODE_NOT_FOUND, 404);
      }

      return successResponse(res, messages.PROMO_CODE_DELETED);

  } catch (error) {
      return errorResponse(res, error.message);
  }
};

// Export the functions
module.exports = {
  createPromoCode,
  getAllPromoCodes,
  getPromoCodeById,
  updatePromoCodeById,
  deletePromoCodeById,
};
