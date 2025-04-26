const {
  create,
  findOne,
  findMany,
  findAndUpdate,
  deleteOne
} = require('../services/mongodb/mongoService');

const { Review } = require('../models/index'); // Ensure Review is included in models/index.js
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");

// Create a new review
const createReview = async (req, res) => {
  try {
    const { productId, rating, reviewText } = req.body;
    const userId = req.user.id; // Extracted from JWT token

    if (!productId || !rating) {
      return errorResponse(res, 400, "Product ID and rating are required.");
    }

    const reviewData = { userId, productId, rating, reviewText };
    const review = await create(Review, reviewData);

    return successResponse(res, 201, messages.REVIEW_CREATED, { review });

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Get all reviews for a product
const getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await findMany(Review, { productId }, null, { path: 'userId', select: 'name' });

    if (!reviews.length) {
      return successResponse(res, 200, messages.REVIEWS_NOT_FOUND, { reviews });
    }

    return successResponse(res, 200, messages.REVIEWS_RETRIEVED, { reviews });

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Update a review by ID
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, reviewText } = req.body;
    const userId = req.user.id; // Extracted from JWT token

    const review = await findAndUpdate(Review, { _id: id, userId }, { rating, reviewText });

    if (!review) {
      return errorResponse(res, 404, messages.REVIEW_NOT_FOUND);
    }

    return successResponse(res, 200, messages.REVIEW_UPDATED, { review });

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Delete a review by ID
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Extracted from JWT token

    const result = await deleteOne(Review, { _id: id, userId });

    if (result.deletedCount === 0) {
      return errorResponse(res, 404, messages.REVIEW_NOT_FOUND);
    }

    return successResponse(res, 200, messages.REVIEW_DELETED);

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Export all functions
module.exports = {
  createReview,
  getReviewsByProduct,
  updateReview,
  deleteReview,
};
