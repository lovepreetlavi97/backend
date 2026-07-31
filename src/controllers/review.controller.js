const { Review, User, Product } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { isValidId } = require("../utils/idUtils");
const { Op } = require("sequelize");

const createReview = async (req, res) => {
  try {
    const { productId, rating, reviewText } = req.body;
    const userId = req.user.id || req.user._id;

    if (!productId || !rating) {
      return errorResponse(res, 400, "Product ID and rating are required.");
    }

    const review = await Review.create({ userId, productId, rating: Number(rating), reviewText, isApproved: true });
    return successResponse(res, 201, messages.REVIEW_CREATED, { review });

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.findAll({
      where: { productId },
      include: [{ model: User, attributes: ['id', 'name'] }]
    });

    return successResponse(res, 200, messages.REVIEWS_RETRIEVED, { reviews });

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, reviewText } = req.body;
    const userId = req.user.id || req.user._id;

    const review = await Review.findOne({ where: { id, userId } });
    if (!review) {
      return errorResponse(res, 404, messages.REVIEW_NOT_FOUND);
    }

    await review.update({ rating: Number(rating), reviewText });
    return successResponse(res, 200, messages.REVIEW_UPDATED, { review });

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const review = await Review.findOne({ where: { id, userId } });
    if (!review) {
      return errorResponse(res, 404, messages.REVIEW_NOT_FOUND);
    }

    await review.destroy();
    return successResponse(res, 200, messages.REVIEW_DELETED);

  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const getAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: reviews } = await Review.findAndCountAll({
      include: [
        { model: User, attributes: ['id', 'name'] },
        { model: Product, attributes: ['id', 'name', 'title', 'slug'] }
      ],
      limit,
      offset,
      order: [['id', 'DESC']]
    });

    return successResponse(res, 200, messages.REVIEWS_RETRIEVED, {
      total: count,
      page,
      limit,
      reviews,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  createReview,
  getReviewsByProduct,
  updateReview,
  deleteReview,
  getAllReviews
};
