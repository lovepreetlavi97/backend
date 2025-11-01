const express = require("express");
const router = express.Router();
const {
  createRazorpayOrder,
  verifyPayment,
} = require("../controllers/payment.controller.js");
// const { userAuth } = require("../middleware/auth.js"); // optional middleware if you need auth

/**
 * @swagger
 * tags:
 *   - name: Payments
 *     description: Razorpay payment processing routes
 */

/**
 * @swagger
 * /payments/create-order:
 *   post:
 *     summary: Create a new Razorpay order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 499
 *               currency:
 *                 type: string
 *                 example: INR
 *               receipt:
 *                 type: string
 *                 example: "order_rcptid_11"
 *     responses:
 *       200:
 *         description: Razorpay order created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/create", createRazorpayOrder);

/**
 * @swagger
 * /payments/verify-payment:
 *   post:
 *     summary: Verify Razorpay payment signature
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpay_order_id
 *               - razorpay_payment_id
 *               - razorpay_signature
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *                 example: "order_Ff9mJX6H1h5Tga"
 *               razorpay_payment_id:
 *                 type: string
 *                 example: "pay_Ff9mKx7xZ4mKQv"
 *               razorpay_signature:
 *                 type: string
 *                 example: "d65a00d49d19d9a3..."
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Invalid signature or request data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/verify", verifyPayment);

module.exports = router;
