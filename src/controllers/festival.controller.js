const {
  create,
  findOne,
  findMany,
  findAndUpdate,
  deleteOne
} = require('../services/mongodb/mongoService');
const { Festival } = require('../models/index'); // Adjust the import based on your project structure
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");

// Create a new festival
const createFestival = async (req, res) => {
  try {
    const imageUrls = req.files.map((file) => file.location);
    const festivalData = req.body;
    if (imageUrls.length === 0) {
      return errorResponse(res, 400, "One image is required");
    }
    
    festivalData.images = imageUrls;

    const festival = await create(Festival, festivalData);
    return successResponse(res, 201, messages.FESTIVAL_CREATED, { festival });

  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

// Get all festivals
const getAllFestivals = async (req, res) => {
  try {
    const festivals = await findMany(Festival);

    if (festivals.length === 0) {
      return successResponse(res, 200, messages.FESTIVALS_NOT_FOUND, { festivals });
    }

    return successResponse(res, 200, messages.FESTIVALS_RETRIEVED, { festivals });

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Get a festival by ID
const getFestivalById = async (req, res) => {
  try {
    const festival = await findOne(Festival, { _id: req.params.id });

    if (!festival) {
      return errorResponse(res, 404, messages.FESTIVAL_NOT_FOUND);
    }

    return successResponse(res, 200, messages.FESTIVAL_RETRIEVED, { festival });

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};
const updateFestivalById = async (req, res) => {
  try {
    // Ensure req.files is handled safely
    const imageUrls = req.files?.map((file) => file.location) || [];

    // Extract festival data from the request body
    const festivalData = req.body;

    console.log(imageUrls.length, "imageUrls.length");

    // Only update images if imageUrls is empty
    if (imageUrls.length === 0) {
      console.log("No new images provided, images will not be updated.");
      delete festivalData.images; // Ensure images field is not updated
    } else {
      console.log(imageUrls, "imageUrls");
      festivalData.images = imageUrls; // Update images if new images exist
    }

    // Find and update the festival by ID
    const festival = await findAndUpdate(Festival, { _id: req.params.id }, festivalData);

    // If festival is not found, return a 404 response
    if (!festival) {
      return errorResponse(res, 404, messages.FESTIVAL_NOT_FOUND);
    }

    // Return success response with updated festival data
    return successResponse(res, 200, messages.FESTIVAL_UPDATED, { festival });

  } catch (error) {
    // Return error response if something goes wrong
    return errorResponse(res, 400, error.message);
  }
};



// Delete a festival by ID
const deleteFestivalById = async (req, res) => {
  try {
    const result = await deleteOne(Festival, { _id: req.params.id });

    if (result.deletedCount === 0) {
      return errorResponse(res, 404, messages.FESTIVAL_NOT_FOUND);
    }

    return successResponse(res, 200, messages.FESTIVAL_DELETED);

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Export all functions
module.exports = {
  createFestival,
  getAllFestivals,
  getFestivalById,
  updateFestivalById,
  deleteFestivalById,
};