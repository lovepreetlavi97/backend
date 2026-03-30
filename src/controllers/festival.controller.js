const {
  create,
  findOne,
  findAndUpdate,
} = require("../services/mongodb/mongoService");
const { Festival } = require("../models/index");
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");
const path = require("path");
const fs = require("fs");
const { uploadToSpaces } = require("../middlewares/uploadMiddleware");
const { Product } = require("../models/index");
const mongoose = require("mongoose");
// Create a new festival
const createFestival = async (req, res) => {
  try {
    const { name, description, startDate, endDate, isActive = true, metalIds } = req.body;

    // Validate required fields
    if (!name || !description || !startDate || !endDate) {
      return errorResponse(res, 400, "Missing required fields");
    }

    let mainImage;
    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      const { buffer, originalname, mimetype } = req.files.mainImage[0];
      mainImage = await uploadToSpaces(buffer, originalname, mimetype);
    } else {
      return errorResponse(res, 400, "Main image is required");
    }

    let cards = [];
    if (req.body.cards) {
      let cardData = [];
      try {
        cardData =
          typeof req.body.cards === "string"
            ? JSON.parse(req.body.cards)
            : req.body.cards;
      } catch (e) {
        return errorResponse(res, 400, "Invalid cards format");
      }

      if (Array.isArray(cardData) && cardData.length > 0) {
        const cardImages = req.files.cardImages || [];
        cards = cardData.map((card, idx) => {
          let image = card.image;
          if (cardImages[idx]) {
            const { buffer, originalname, mimetype } = cardImages[idx];
            image = uploadToSpaces(buffer, originalname, mimetype);
          }
          return {
            slug: card.slug,
            image,
          };
        });

        cards = await Promise.all(
          cards.map(async (card, idx) => {
            if (card.image instanceof Promise) {
              card.image = await card.image;
            }
            return card;
          })
        );
      }
    }

    // Create festival data object
    const festivalData = {
      name,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isActive: isActive === "true" || isActive === true,
      mainImage,
      cards,
      metalIds: typeof metalIds === 'string' ? JSON.parse(metalIds) : metalIds,
    };

    // Create the festival
    const festival = await create(Festival, festivalData);

    // Clear cache
    await cacheUtils.delPattern("festivals_*");

    return successResponse(res, 201, "Festival created successfully", {
      festival,
    });
  } catch (error) {
    console.error("Create festival error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Get all festivals with pagination and filters
const getAllFestivals = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      sortBy = "createdAt",
      sortOrder = "desc",
      metalId,
    } = req.query;

    // Create cache key
    const cacheKey = `festivals_${page}_${limit}_${search || ""}_${
      isActive || ""
    }_${metalId || ""}`;

    // Try to get from cache
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      return successResponse(
        res,
        200,
        "Festivals retrieved successfully",
        cachedData
      );
    }

    // Build query
    const query = { isDeleted: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    if (metalId && mongoose.Types.ObjectId.isValid(metalId)) {
      query.metalIds = { $in: [new mongoose.Types.ObjectId(metalId)] };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort configuration
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query
    const festivals = await Festival.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Festival.countDocuments(query);

    const result = {
      festivals,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    };

    // Cache the result
    await cacheUtils.set(cacheKey, result, 300); // Cache for 5 minutes

    return successResponse(
      res,
      200,
      "Festivals retrieved successfully",
      result
    );
  } catch (error) {
    console.error("Get all festivals error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Get a festival by ID
const getFestivalById = async (req, res) => {
  try {
    const { id } = req.params;

    const festival = await findOne(Festival, {
      _id: id,
      isDeleted: false,
    });

    if (!festival) {
      return errorResponse(res, 404, "Festival not found");
    }

    return successResponse(res, 200, "Festival retrieved successfully", {
      festival,
    });
  } catch (error) {
    console.error("Get festival error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};
// Update a festival by ID
const updateFestivalById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Check if festival exists
    const existingFestival = await Festival.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!existingFestival) {
      return errorResponse(res, 404, "Festival not found");
    }

    // Process dates if they exist
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }
    if (updateData.isActive !== undefined) {
      updateData.isActive =
        updateData.isActive === "true" || updateData.isActive === true;
    }

    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      const { buffer, originalname, mimetype } = req.files.mainImage[0];
      updateData.mainImage = await uploadToSpaces(buffer, originalname, mimetype);
    }

    if (updateData.cards) {
      console.log({cards: updateData.cards});
      let cardData = [];
      try {
        cardData = typeof updateData.cards === "string" ? JSON.parse(updateData.cards) : updateData.cards;
      } catch (e) {
        console.error("Invalid cards format:", e);
        return errorResponse(res, 400, "Invalid cards format");
      }

      if (Array.isArray(cardData) && cardData.length > 0) {
        const cardImages = req.files?.cardImages || [];
        
        let uploadedCardIndices = [];
        cardData.forEach((card, idx) => {
          if (!card.image || card.image === "") {
            uploadedCardIndices.push(idx);
          }
        });
        
        let cards = cardData.map((card, idx) => {
          let image = card.image;
          
          if ((!image || image === "") && uploadedCardIndices.includes(idx) && cardImages.length > 0) {
            const fileIndex = uploadedCardIndices.indexOf(idx);
            if (fileIndex < cardImages.length) {
              const { buffer, originalname, mimetype } = cardImages[fileIndex];
              image = uploadToSpaces(buffer, originalname, mimetype);
            }
          }
          
          return {
            slug: card.slug,
            image,
          };
        });

        cards = await Promise.all(cards.map(async (card) => {
          if (card.image instanceof Promise) {
            card.image = await card.image;
          }
          return card;
        }));

        updateData.cards = cards;
      }
    }

    // Update festival
    const festival = await findAndUpdate(Festival, { _id: id }, updateData);

    // Clear cache
    await cacheUtils.delPattern("festivals_*");

    return successResponse(res, 200, "Festival updated successfully", {
      festival,
    });
  } catch (error) {
    console.error("Update festival error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Delete a festival by ID (soft delete)
const deleteFestivalById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if festival exists
    const existingFestival = await Festival.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!existingFestival) {
      return errorResponse(res, 404, "Festival not found");
    }

    // Soft delete by setting isDeleted to true
    await findAndUpdate(Festival, { _id: id }, { isDeleted: true });

    // Clear cache
    await cacheUtils.delPattern("festivals_*");

    return successResponse(res, 200, "Festival deleted successfully");
  } catch (error) {
    console.error("Delete festival error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

// Toggle festival status
const toggleFestivalStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if festival exists
    const existingFestival = await Festival.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!existingFestival) {
      return errorResponse(res, 404, "Festival not found");
    }

    // Toggle isActive status
    const updatedFestival = await findAndUpdate(
      Festival,
      { _id: id },
      { isActive: !existingFestival.isActive }
    );

    // Clear cache
    await cacheUtils.delPattern("festivals_*");

    return successResponse(res, 200, "Festival status toggled successfully", {
      festival: updatedFestival,
    });
  } catch (error) {
    console.error("Toggle festival status error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

const getProductsByFestival = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      categoryId,
      subcategoryId,
      minPrice,
      maxPrice,
      inStock,
      search,
      isFeatured,
      metalId,
    } = req.query;

    const { id: festivalId } = req.params;

    // Validate festivalId
    if (!mongoose.Types.ObjectId.isValid(festivalId)) {
      return errorResponse(res, 400, "Invalid festival ID format");
    }

    // Create cache key based on query parameters
    const cacheKey = `festival_products_${festivalId}_${page}_${limit}_${sortBy}_${sortOrder}_${
      categoryId || ""
    }_${subcategoryId || ""}_${minPrice || ""}_${maxPrice || ""}_${
      inStock || ""
    }_${search || ""}_${isFeatured || ""}_${metalId || ""}`;

    // Try to get from cache
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      return successResponse(res, 200, messages.PRODUCTS_RETRIEVED, cachedData);
    }

    // Build query
    const query = {
      isDeleted: false,
      festivalIds: festivalId,
    };

    if (metalId && mongoose.Types.ObjectId.isValid(metalId)) {
      query.metalIds = { $in: [new mongoose.Types.ObjectId(metalId)] };
    }

    if (categoryId) {
      query.categoryId = mongoose.Types.ObjectId.isValid(categoryId)
        ? new mongoose.Types.ObjectId(categoryId)
        : null;
    }

    if (subcategoryId) {
      query.subcategoryId = mongoose.Types.ObjectId.isValid(subcategoryId)
        ? new mongoose.Types.ObjectId(subcategoryId)
        : null;
    }

    if (minPrice !== undefined) {
      query.actualPrice = { ...query.actualPrice, $gte: parseFloat(minPrice) };
    }

    if (maxPrice !== undefined) {
      query.actualPrice = { ...query.actualPrice, $lte: parseFloat(maxPrice) };
    }

    if (inStock === "true") {
      query.isInStock = true;
    }

    if (isFeatured === "true") {
      query.isFeatured = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

    // Fetch products
    const products = await Product.find(query)
      .populate({ path: "categoryId", select: "name slug" })
      .populate({ path: "subcategoryId", select: "name slug" })
      .populate({ path: "festivalIds", select: "name slug" })
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOptions)
      .lean();

    const total = await Product.countDocuments(query);

    const result = {
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    };

    // Cache the result
    await cacheUtils.set(cacheKey, result, 300); // 5-minute cache

    return successResponse(
      res,
      200,
      products.length
        ? messages.PRODUCTS_RETRIEVED
        : messages.PRODUCTS_NOT_FOUND,
      result
    );
  } catch (error) {
    console.error("Get products by festival error:", error);
    return errorResponse(
      res,
      500,
      error.message || "Error retrieving products for festival"
    );
  }
};

// Export all functions
module.exports = {
  createFestival,
  getAllFestivals,
  getFestivalById,
  updateFestivalById,
  deleteFestivalById,
  toggleFestivalStatus,
  getProductsByFestival,
};
