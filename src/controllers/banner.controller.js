const Banner = require('../models/banner.model');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const { cacheUtils } = require("../config/redis");
const { uploadToSpaces } = require("../middlewares/uploadMiddleware");
const { isValidId } = require("../utils/idUtils");

const createBanner = async (req, res) => {
  try {
    const { title, description, type = 'home', link = '', startDate, endDate } = req.body;

    if (!title || !startDate || !endDate) {
      return errorResponse(res, 400, "Missing required fields");
    }

    let imageKey = '';
    if (req.file) {
      const { buffer, originalname, mimetype } = req.file;
      imageKey = await uploadToSpaces(buffer, originalname, mimetype);
    }

    const banner = await Banner.create({
      title,
      description,
      type,
      link,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      imageUrl: imageKey,
      status: 'active'
    });

    await cacheUtils.delPattern('banners_*');
    return successResponse(res, 201, "Banner created successfully", { banner });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

const getAllBanners = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: banners } = await Banner.findAndCountAll({
      limit: parsedLimit,
      offset,
      order: [['id', 'DESC']]
    });

    return successResponse(res, 200, "Banners retrieved successfully", {
      banners,
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

const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return errorResponse(res, 400, "Invalid ID");

    const banner = await Banner.findByPk(id);
    if (!banner) return errorResponse(res, 404, "Banner not found");

    return successResponse(res, 200, "Banner retrieved successfully", { banner });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

const updateBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return errorResponse(res, 400, "Invalid ID");

    const banner = await Banner.findByPk(id);
    if (!banner) return errorResponse(res, 404, "Banner not found");

    const updateData = { ...req.body };
    if (req.file) {
      const { buffer, originalname, mimetype } = req.file;
      updateData.imageUrl = await uploadToSpaces(buffer, originalname, mimetype);
    }

    await banner.update(updateData);
    await cacheUtils.delPattern('banners_*');

    return successResponse(res, 200, "Banner updated successfully", { banner });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

const deleteBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return errorResponse(res, 400, "Invalid ID");

    const banner = await Banner.findByPk(id);
    if (!banner) return errorResponse(res, 404, "Banner not found");

    await banner.destroy();
    await cacheUtils.delPattern('banners_*');

    return successResponse(res, 200, "Banner deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

const toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return errorResponse(res, 400, "Invalid ID");

    const banner = await Banner.findByPk(id);
    if (!banner) return errorResponse(res, 404, "Banner not found");

    const newStatus = banner.status === 'active' ? 'inactive' : 'active';
    await banner.update({ status: newStatus });
    await cacheUtils.delPattern('banners_*');

    return successResponse(res, 200, `Banner ${newStatus} successfully`, { banner });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

const updateBannerPosition = async (req, res) => {
  return successResponse(res, 200, "Position updated");
};

module.exports = {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBannerById,
  deleteBannerById,
  toggleBannerStatus,
  updateBannerPosition
};
