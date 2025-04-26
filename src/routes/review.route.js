const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller');
const { userAuth } = require('../middlewares/auth/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: API endpoints for managing product reviews
 */

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Create a new product review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 description: The ID of the product being reviewed.
 *                 example: "65c1234567890abcdef12345"
 *               rating:
 *                 type: number
 *                 description: Rating given by the user (1-5).
 *                 example: 4
 *               reviewText:
 *                 type: string
 *                 description: Optional review text.
 *                 example: "Great quality and beautiful design!"
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/', userAuth, reviewController.createReview);

/**
 * @swagger
 * /reviews/{productId}:
 *   get:
 *     summary: Get all reviews for a specific product
 *     tags: [Reviews]
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         description: The ID of the product
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reviews for the product
 *       404:
 *         description: No reviews found
 */
router.get('/:productId', reviewController.getReviewsByProduct);

/**
 * @swagger
 * /reviews/{id}:
 *   put:
 *     summary: Update a review by ID
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the review
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 description: Updated rating (1-5).
 *                 example: 5
 *               reviewText:
 *                 type: string
 *                 description: Updated review text.
 *                 example: "Absolutely love it!"
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       404:
 *         description: Review not found
 *       400:
 *         description: Bad request
 */
router.put('/:id', userAuth, reviewController.updateReview);

/**
 * @swagger
 * /reviews/{id}:
 *   delete:
 *     summary: Delete a review by ID
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the review
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 */
router.delete('/:id', userAuth, reviewController.deleteReview);

module.exports = router;
