const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { userAuth, adminAuth } = require('../middlewares/auth/auth.middleware');
const { check } = require('express-validator');

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
 *             required: [products, shippingAddress, paymentMethod]
 *             properties:
 *               products:
 *                 type: array
 *                 description: Array of products to order
 *                 items:
 *                   type: object
 *                   required: [productId, quantity]
 *                   properties:
 *                     productId:
 *                       type: string
 *                       description: MongoDB ID of the product
 *                     quantity:
 *                       type: integer
 *                       description: Quantity to order
 *                       minimum: 1
 *               shippingAddress:
 *                 type: object
 *                 required: [addressLine1, city, state, postalCode, contactName, contactPhone]
 *                 properties:
 *                   addressLine1:
 *                     type: string
 *                     description: Street address
 *                   addressLine2:
 *                     type: string
 *                     description: Additional address details
 *                   city:
 *                     type: string
 *                     description: City name
 *                   state:
 *                     type: string
 *                     description: State name
 *                   postalCode:
 *                     type: string
 *                     description: Zip/postal code
 *                   country:
 *                     type: string
 *                     description: Country (defaults to India)
 *                   contactName:
 *                     type: string
 *                     description: Name of the recipient
 *                   contactPhone:
 *                     type: string
 *                     description: Phone number of the recipient
 *                   label:
 *                     type: string
 *                     enum: [Home, Work, Other]
 *                     default: Home
 *               billingAddress:
 *                 type: object
 *                 description: Billing address (if different from shipping address)
 *                 properties:
 *                   addressLine1:
 *                     type: string
 *                   addressLine2:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *                   contactName:
 *                     type: string
 *                   contactPhone:
 *                     type: string
 *                   label:
 *                     type: string
 *               promoCode:
 *                 type: string
 *                 description: MongoDB ID of the promo code
 *               paymentMethod:
 *                 type: string
 *                 description: Payment method for the order
 *                 enum: [COD, CREDIT_CARD, DEBIT_CARD, UPI, NET_BANKING, WALLET, PAYPAL]
 *               deliveryNotes:
 *                 type: string
 *                 description: Special instructions for delivery
 *               giftWrap:
 *                 type: boolean
 *                 description: Whether gift wrapping is requested
 *                 default: false
 *               giftMessage:
 *                 type: string
 *                 description: Message for gift wrap
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: "Order created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     order:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "60d21b4667d0d8992e610c85"
 *                         orderNumber:
 *                           type: string
 *                           example: "ORD-20230818-1234"
 *                         subtotal:
 *                           type: number
 *                           example: 1299.99
 *                         shippingCharge:
 *                           type: number
 *                           example: 50
 *                         taxAmount:
 *                           type: number
 *                           example: 234
 *                         discountAmount:
 *                           type: number
 *                           example: 100
 *                         finalAmount:
 *                           type: number
 *                           example: 1483.99
 *                         status:
 *                           type: string
 *                           example: "Pending"
 *                         paymentStatus:
 *                           type: string
 *                           example: "Pending"
 *                         estimatedDelivery:
 *                           type: string
 *                           format: date-time
 *                         paymentMethod:
 *                           type: string
 *                           example: "COD"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Missing or invalid parameters
 *       401:
 *         description: Unauthorized - User not authenticated
 *       404:
 *         description: Not found - Products not found or unavailable
 *       500:
 *         description: Internal server error
 */
router.post(
  '/',
  userAuth,
  [
    // Product validation
    check('products')
      .isArray({ min: 1 })
      .withMessage('At least one product is required'),
    check('products.*.productId')
      .isMongoId()
      .withMessage('Invalid product ID'),
    check('products.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
      
    // Shipping address validation  
    check('shippingAddress')
      .isObject()
      .withMessage('Shipping address is required'),
    check('shippingAddress.addressLine1')
      .notEmpty()
      .withMessage('Street address is required'),
    check('shippingAddress.city')
      .notEmpty()
      .withMessage('City is required'),
    check('shippingAddress.state')
      .notEmpty()
      .withMessage('State is required'),
    check('shippingAddress.postalCode')
      .notEmpty()
      .withMessage('Postal/ZIP code is required'),
    check('shippingAddress.contactName')
      .notEmpty()
      .withMessage('Recipient name is required'),
    check('shippingAddress.contactPhone')
      .notEmpty()
      .withMessage('Recipient phone number is required'),
    check('shippingAddress.label')
      .optional()
      .isIn(['Home', 'Work', 'Other'])
      .withMessage('Label must be Home, Work, or Other'),
      
    // Payment validation
    check('paymentMethod')
      .isIn(['COD', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'WALLET', 'PAYPAL'])
      .withMessage('Invalid payment method'),
      
    // Optional fields validation
    check('promoCode')
      .optional()
      .isMongoId()
      .withMessage('Invalid promo code ID'),
    check('giftWrap')
      .optional()
      .isBoolean()
      .withMessage('Gift wrap must be a boolean'),
    check('deliveryNotes')
      .optional()
      .isString()
      .withMessage('Delivery notes must be a string'),
    check('giftMessage')
      .optional()
      .isString()
      .withMessage('Gift message must be a string')
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
      .isIn([  'Pending',
  'Processing',
  'Confirmed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Returned',
  'Refunded'])
      .withMessage('Invalid order status'),
  ],
  orderController.updateOrderStatus
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
