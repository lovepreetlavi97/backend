const { Festival, Product } = require("../models/index");
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");
const { isValidId } = require("../utils/idUtils");

const createFestival = async (req, res) => {
  try {
    const { name, description, startDate, endDate, isActive = true } = req.body;

    if (!name || !description || !startDate || !endDate) {
      return errorResponse(res, 400, "Missing required fields");
    }

    const festival = await Festival.create({
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive === "true" || isActive === true
    });

    await cacheUtils.delPattern("festivals_*");
    return successResponse(res, 201, "Festival created successfully", { festival });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

const getAllFestivals = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: festivals } = await Festival.findAndCountAll({
      limit: parsedLimit,
      offset,
      order: [['id', 'DESC']]
    });

    return successResponse(res, 200, "Festivals retrieved successfully", {
      festivals,
      pagination: {
        total: count,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(count / parsedLimit)
      }
    });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

const getFestivalById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return errorResponse(res, 400, "Invalid ID");

    const festival = await Festival.findByPk(id);
    if (!festival) return errorResponse(res, 404, "Festival not found");

    return successResponse(res, 200, "Festival retrieved successfully", { festival });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

const updateFestivalById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return errorResponse(res, 400, "Invalid ID");

    const festival = await Festival.findByPk(id);
    if (!festival) return errorResponse(res, 404, "Festival not found");

    await festival.update(req.body);
    await cacheUtils.delPattern("festivals_*");

    return successResponse(res, 200, "Festival updated successfully", { festival });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

const deleteFestivalById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return errorResponse(res, 400, "Invalid ID");

    const festival = await Festival.findByPk(id);
    if (!festival) return errorResponse(res, 404, "Festival not found");

    await festival.destroy();
    await cacheUtils.delPattern("festivals_*");

    return successResponse(res, 200, "Festival deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

const toggleFestivalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return errorResponse(res, 400, "Invalid ID");

    const festival = await Festival.findByPk(id);
    if (!festival) return errorResponse(res, 404, "Festival not found");

    await festival.update({ isActive: !festival.isActive });
    await cacheUtils.delPattern("festivals_*");

    return successResponse(res, 200, "Festival status toggled successfully", { festival });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

const getProductsByFestival = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: products } = await Product.findAndCountAll({
      limit: parsedLimit,
      offset,
      order: [['id', 'DESC']]
    });

    return successResponse(res, 200, messages.PRODUCTS_RETRIEVED, {
      products,
      pagination: {
        total: count,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(count / parsedLimit)
      }
    });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Error retrieving products for festival");
  }
};

module.exports = {
  createFestival,
  getAllFestivals,
  getFestivalById,
  updateFestivalById,
  deleteFestivalById,
  toggleFestivalStatus,
  getProductsByFestival,
};
