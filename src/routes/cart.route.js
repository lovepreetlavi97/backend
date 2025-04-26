const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");
const {  userAuth } = require('../middlewares/auth/auth.middleware');
/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Cart management
 */
/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 */
router.post("/add",userAuth, cartController.addToCart);
/**
 * @swagger
 * /cart/remove:
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
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
 *         description: Item removed from cart successfully
 */
router.delete("/remove",userAuth, cartController.removeFromCart);
/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get cart items for a user
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 */
router.get("/", userAuth,cartController.getCart);

/**
 * @swagger
 * /cart/update-quantity:
 *   post:
 *     summary: Increment or decrement product quantity in cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum: [inc, dec]
 *     responses:
 *       200:
 *         description: Quantity updated successfully
 */
router.post("/update-quantity", userAuth, cartController.updateCartQuantity);


module.exports = router;