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
const getAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search?.trim();
    const minRating = parseFloat(req.query.minRating);
    const maxRating = parseFloat(req.query.maxRating);

    const matchStage = {};

    // ⭐ Rating range filter
    if (!isNaN(minRating) || !isNaN(maxRating)) {
      matchStage.rating = {};
      if (!isNaN(minRating)) matchStage.rating.$gte = minRating;
      if (!isNaN(maxRating)) matchStage.rating.$lte = maxRating;
    }

    const pipeline = [
      { $match: matchStage },

      // 👤 Join users
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      // 🛍 Join products
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
    ];

    // 🔍 Search by user name OR product name
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "user.name": { $regex: search, $options: "i" } },
            { "product.name": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // 📊 Sort + pagination
    pipeline.push(
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      }
    );

    const result = await Review.aggregate(pipeline);

    const reviews = result[0].data.map((r) => ({
      _id: r._id,
      rating: r.rating,
      reviewText: r.reviewText,
      images: r.images,
      helpfulCount: r.helpfulCount,
      createdAt: r.createdAt,
      user: {
        _id: r.user._id,
        name: r.user.name,
        profileImage: r.user.profileImage,
      },
      product: {
        _id: r.product._id,
        name: r.product.name,
        slug: r.product.slug,
        images: r.product.images,
      },
    }));

    const total = result[0].totalCount[0]?.count || 0;

    return successResponse(res, 200, messages.REVIEWS_RETRIEVED, {
      total,
      page,
      limit,
      reviews,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  getAllReviews,
};


// Export all functions
module.exports = {
  createReview,
  getReviewsByProduct,
  updateReview,
  deleteReview,
  getAllReviews
};
