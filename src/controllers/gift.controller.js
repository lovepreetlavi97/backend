const { Product, Gift, Banner } = require("../models");
const { create, findOne, findMany, findAndUpdate, countDocuments } = require("../services/mysql/mysqlService");
const { successResponse, errorResponse } = require("../utils/responseUtil");
const slugify = require("slugify");

/**
 * Get available gift filters dynamically
 */
const getGiftFilters = async (req, res) => {
  try {
    // Fetch active gifts (occasions) from the model
    const activeGifts = await findMany(Gift, { isActive: true, isDeleted: false });
    const giftBanner = await findOne(Banner, { type: 'gift', isDeleted: false }, {}, { sort: { position: -1 } });

    const priceRanges = [
      { label: "Under ₹1,000", min: 0, max: 1000 },
      { label: "₹1,000 - ₹2,000", min: 1000, max: 2000 },
      { label: "₹2,000 - ₹3,000", min: 2000, max: 3000 },
      { label: "₹3,000 - ₹5,000", min: 3000, max: 5000 },
      { label: "Above ₹5,000", min: 5000 },
    ];

    const filters = {
      occasions: activeGifts || [],
      themes: [],
      recipients: [],
      priceRanges,
      banner: giftBanner
    };

    return successResponse(res, 200, "Gift filters retrieved successfully", filters);
  } catch (error) {
    return errorResponse(res, 500, "Error fetching gift filters");
  }
};

// --- Admin Controllers ---

const createGift = async (req, res) => {
  try {
    const { name, image, description, isActive } = req.body;
    const slug = slugify(name, { lower: true, strict: true });

    const gift = await create(Gift, {
      name,
      slug,
      image,
      description,
      isActive,
    });

    return successResponse(res, 201, "Gift created successfully", gift);
  } catch (error) {
    return errorResponse(res, 500, error.message || "Error creating gift");
  }
};

const getAllGifts = async (req, res) => {
  try {
    const gifts = await findMany(Gift, { isDeleted: false }, {}, { sort: { createdAt: -1 } });
    return successResponse(res, 200, "Gifts retrieved successfully", gifts);
  } catch (error) {
    return errorResponse(res, 500, "Error fetching gifts");
  }
};

const updateGift = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image, description, isActive } = req.body;
    
    const updateData = { image, description, isActive };
    if (name) {
      updateData.name = name;
      updateData.slug = slugify(name, { lower: true, strict: true });
    }

    const gift = await findAndUpdate(Gift, { id }, updateData);
    if (!gift) return errorResponse(res, 404, "Gift not found");

    return successResponse(res, 200, "Gift updated successfully", gift);
  } catch (error) {
    return errorResponse(res, 500, "Error updating gift");
  }
};

const deleteGift = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if gift exists
    const gift = await findOne(Gift, { id, isDeleted: false });
    if (!gift) return errorResponse(res, 404, "Gift not found");

    // Dependency check: check if any active products are using this gift
    const productsCount = await countDocuments(Product, { giftId: id, isDeleted: false });
    if (productsCount > 0) {
      return errorResponse(res, 400, `Cannot delete gift. There are ${productsCount} active products associated with it.`);
    }

    await findAndUpdate(Gift, { id }, { isDeleted: true });
    return successResponse(res, 200, "Gift deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, "Error deleting gift");
  }
};

module.exports = {
  getGiftFilters,
  createGift,
  getAllGifts,
  updateGift,
  deleteGift,
};
