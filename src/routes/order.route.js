const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { userAuth, adminAuth, optionalUserAuth } = require('../middlewares/auth/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { createOrderSchema, updateOrderStatusSchema, updatePaymentStatusSchema } = require('../validations/order.validation');

router.post(
  '/',
  optionalUserAuth,
  validate(createOrderSchema),
  orderController.createOrder
);

// Public track-order endpoints (guest or logged-in user by Order ID + Phone)
router.post('/track', orderController.trackOrderPublic);
router.post('/track/cancel', orderController.cancelOrderPublic);
router.post('/track/return', orderController.requestReturnPublic);
router.post('/magic', orderController.getOrderByMagicToken);

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
 *       - name: productId
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
router.get('/:id/product/:productId', userAuth, orderController.getOrderById);


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
 * /orders/refunds:
 *   get:
 *     summary: Get refund/cancellation requests (Admin only)
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
 *       - name: refundStatus
 *         in: query
 *         schema:
 *           type: string
 *           enum: [ALL, REFUNDED, PROCESSING, PENDING]
 *           default: ALL
 *       - name: sort
 *         in: query
 *         schema:
 *           type: string
 *           enum: [createdAt:desc, createdAt:asc, finalAmount:desc, finalAmount:asc]
 *           default: createdAt:desc
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *           description: orderNumber, refundTransactionId, or userId
 *     responses:
 *       200:
 *         description: Refund requests retrieved successfully
 *       403:
 *         description: Forbidden
 */
router.get('/refunds', adminAuth, orderController.getRefundRequests);

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
 *                 enum:
 *                   - Pending
 *                   - Processing
 *                   - Confirmed
 *                   - Shipped
 *                   - Out for Delivery
 *                   - Delivered
 *                   - Cancelled
 *                   - Returned
 *                   - Refunded
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       404:
 *         description: Order not found
 */
router.put(
  '/:id',
  adminAuth,
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

/**
 * @swagger
 * /orders/{id}/payment-status:
 *   put:
 *     summary: Update payment status for an order (Admin only)
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
 *             required: [paymentStatus]
 *             properties:
 *               paymentStatus:
 *                 type: string
 *                 enum: [Pending, Paid, Failed, Refunded, Partially Refunded]
 *               transactionId:
 *                 type: string
 *               paymentDetails:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *       400:
 *         description: Invalid request
 */
router.put(
  '/:id/payment-status',
  adminAuth,
  validate(updatePaymentStatusSchema),
  orderController.updatePaymentStatus
);
/**
 * @swagger
 * /orders/{orderId}/products/{productId}/status:
 *   patch:
 *     summary: Update single product status in an order (Admin only)
 *     tags: [Order]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: orderId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: productId
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - Pending
 *                   - Processing
 *                   - Confirmed
 *                   - Shipped
 *                   - Out for Delivery
 *                   - Delivered
 *                   - Cancelled
 *                   - Returned
 *                   - Refunded
 *     responses:
 *       200:
 *         description: Product status updated successfully
 */
router.patch(
  '/:orderId/products/:productId/status',
  adminAuth,
  orderController.updateProductStatus
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
