const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const { userAuth, adminAuth } = require('../middlewares/auth/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Payment transactions management
 */

/**
 * @swagger
 * /transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [Card, PayPal, Razorpay, Bank Transfer, UPI, Wallet]
 *               transactionId:
 *                 type: string
 *               amount:
 *                 type: number
 *               gateway:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Bad request
 */
router.post("/", userAuth, transactionController.createTransaction);

/**
 * @swagger
 * /transactions/stats:
 *   get:
 *     summary: Get transaction statistics (Admin only)
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Transaction statistics retrieved successfully
 */
router.get("/stats", adminAuth, transactionController.getTransactionStats);

/**
 * @swagger
 * /transactions/user/all:
 *   get:
 *     summary: Get all transactions of the logged-in user
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *       - name: paymentMethod
 *         in: query
 *         schema:
 *           type: string
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: User's transactions retrieved successfully
 */
router.get("/user/all", userAuth, transactionController.getUserTransactions);

/**
 * @swagger
 * /transactions/order/{orderId}:
 *   get:
 *     summary: Get all transactions for a specific order
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: orderId
 *         in: path
 *         required: true
 *         description: Order ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order transactions retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get("/order/:orderId", userAuth, transactionController.getTransactionsByOrderId);

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Get transaction details by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Transaction ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction details retrieved successfully
 *       404:
 *         description: Transaction not found
 */
router.get("/:id", userAuth, transactionController.getTransactionById);

/**
 * @swagger
 * /transactions/{id}/status:
 *   put:
 *     summary: Update transaction status
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Transaction ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, Completed, Failed, Refunded]
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Transaction not found
 */
router.put("/:id/status", adminAuth, transactionController.updateTransactionStatus);

module.exports = router;
