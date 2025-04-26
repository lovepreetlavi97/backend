const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { userAuth, adminAuth } = require('../middlewares/auth/auth.middleware');
const { check, validationResult } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Order
 *   description: Order management
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     quantity:
 *                       type: number
 *               shippingCharge:
 *                 type: number
 *               tax:
 *                 type: number
 *               taxAmount:
 *                 type: number
 *               totalAmount:
 *                 type: number
 *               discountAmount:
 *                 type: number
 *               finalAmount:
 *                 type: number
 *               promoCode:
 *                 type: string
 *               shippingAddress:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: ["Credit Card", "Debit Card", "UPI", "Net Banking", "COD"]
 *               paymentStatus:
 *                 type: string
 *                 enum: ["Pending", "Paid", "Failed", "Refunded"]
 *               estimatedDelivery:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  userAuth,
  [
    check('products').isArray({ min: 1 }).withMessage('At least one product is required'),
    check('products.*.productId').isMongoId().withMessage('Invalid product ID'),
    check('products.*.name').isString().withMessage('Product name is required'),
    check('products.*.price').isNumeric().withMessage('Product price must be a number'),
    check('products.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    check('shippingCharge').optional().isNumeric().withMessage('Shipping charge must be a number'),
    check('tax').optional().isNumeric().withMessage('Tax must be a number'),
    check('taxAmount').optional().isNumeric().withMessage('Tax amount must be a number'),
    check('totalAmount').exists().isNumeric().withMessage('Total amount is required and must be a number'),
    check('discountAmount').optional().isNumeric().withMessage('Discount amount must be a number'),
    check('finalAmount').exists().isNumeric().withMessage('Final amount is required and must be a number'),
    check('promoCode').optional().isMongoId().withMessage('Invalid promo code ID'),
    check('shippingAddress').notEmpty().withMessage('Shipping address is required'),
    check('paymentMethod')
      .isIn(['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'COD'])
      .withMessage('Invalid payment method'),
    check('paymentStatus')
      .optional()
      .isIn(['Pending', 'Paid', 'Failed', 'Refunded'])
      .withMessage('Invalid payment status'),
    check('estimatedDelivery').optional().isISO8601().withMessage('Estimated delivery must be a valid date'),
  ],
  orderController.createOrder
);

/**
 * @swagger
 * /orders/user:
 *   get:
 *     summary: Get user's own orders
 *     tags: [Order]
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
 *     responses:
 *       200:
 *         description: User's orders retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/user', userAuth, orderController.getUserOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get('/:id', userAuth, orderController.getOrderById);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all orders
 *       403:
 *         description: Forbidden
 */
router.get('/', adminAuth, orderController.getAllOrders);

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Update order status (Admin only)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
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
 *                 enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       404:
 *         description: Order not found
 */
router.put(
  '/:id',
  adminAuth,
  [
    check('status')
      .isIn(['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'])
      .withMessage('Invalid order status'),
  ],
  orderController.updateOrderStatus
);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   put:
 *     summary: Cancel an order (User only)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       404:
 *         description: Order not found
 */
router.put('/:id/cancel', userAuth, orderController.cancelOrder);

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Delete an order (Admin only)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Order deleted successfully
 *       404:
 *         description: Order not found
 */
router.delete('/:id', adminAuth, orderController.deleteOrder);

module.exports = router;
