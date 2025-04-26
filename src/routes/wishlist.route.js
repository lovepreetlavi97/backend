const express = require("express");
const router = express.Router();
const wishlistController = require("../controllers/wishlist.controller");
const {  userAuth } = require('../middlewares/auth/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: Wishlist management
 */
/**
 * @swagger
 * /wishlist/add:
 *   post:
 *     summary: Add item to wishlist
 *     tags: [Wishlist]
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
 *     responses:
 *       200:
 *         description: Item added to wishlist successfully
 *       400:
 *         description: Bad request
 */
router.post("/add", userAuth, wishlistController.addToWishlist);
/**
 * @swagger
 * /wishlist/remove:
 *   delete:
 *     summary: Remove item from wishlist
 *     tags: [Wishlist]
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
 *     responses:
 *       200:
 *         description: Item removed from wishlist successfully
 *       404:
 *         description: Wishlist not found
 */
router.delete("/remove", userAuth, wishlistController.removeFromWishlist);
/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Get wishlist items for a user
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 */
router.get("/", userAuth, wishlistController.getWishlist);

/**
 * @swagger
 * /wishlist/clear:
 *   delete:
 *     summary: Clear all items from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist cleared successfully
 *       404:
 *         description: Wishlist not found
 */
router.delete("/clear", userAuth, wishlistController.clearWishlist);

/**
 * @swagger
 * /wishlist/check/{productId}:
 *   get:
 *     summary: Check if a product is in user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: productId
 *         in: path
 *         required: true
 *         description: Product ID to check
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wishlist status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inWishlist:
 *                   type: boolean
 */
router.get("/check/:productId", userAuth, wishlistController.isProductInWishlist);

module.exports = router;