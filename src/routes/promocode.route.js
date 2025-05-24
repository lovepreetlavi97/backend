const express = require('express');
const router = express.Router();
const { promoCodeController } = require('../controllers');
const { adminAuth, userAuth } = require('../middlewares/auth/auth.middleware');
const { cacheRoute, clearRouteCache } = require('../middlewares/cache/cache.middleware');
/**
 * @swagger
 * tags:
 *   name: PromoCode
 *   description: Promo code management
 */

/**
 * @swagger
 * /promocodes:
 *   post:
 *     summary: Create a new promo code
 *     tags: [Promo Codes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PromoCodeInput'
 *     responses:
 *       201:
 *         description: Promo code created successfully
 *       400:
 *         description: Bad request
 */
router.post(
  '/',
  adminAuth,
  clearRouteCache('promo_codes_*'),
  promoCodeController.createPromoCode
);

/**
 * @swagger
 * /promocodes:
 *   get:
 *     summary: Get all promo codes
 *     tags: [Promo Codes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by type
 *     responses:
 *       200:
 *         description: A list of promo codes
 */
router.get(
  '/',
  adminAuth,
  cacheRoute(300), // Cache for 5 minutes
  promoCodeController.getAllPromoCodes
);

/**
 * @swagger
 * /promocodes/{id}:
 *   get:
 *     summary: Get a promo code by ID
 *     tags: [Promo Codes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Promo code details
 *       404:
 *         description: Promo code not found
 */
router.get(
  '/:id',
  adminAuth,
  cacheRoute(300),
  promoCodeController.getPromoCodeById
);

/**
 * @swagger
 * /promocodes/{id}:
 *   put:
 *     summary: Update a promo code
 *     tags: [Promo Codes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PromoCodeInput'
 *     responses:
 *       200:
 *         description: Promo code updated successfully
 *       404:
 *         description: Promo code not found
 */
router.put(
  '/:id',
  adminAuth,
  clearRouteCache('promo_codes_*'),
  promoCodeController.updatePromoCodeById
);

/**
 * @swagger
 * /promocodes/{id}:
 *   delete:
 *     summary: Delete a promo code
 *     tags: [Promo Codes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Promo code deleted successfully
 *       404:
 *         description: Promo code not found
 */
router.delete(
  '/:id',
  adminAuth,
  clearRouteCache('promo_codes_*'),
  promoCodeController.deletePromoCodeById
);

/**
 * @swagger
 * /promocodes/{id}/toggle-status:
 *   patch:
 *     summary: Toggle promo code status
 *     tags: [Promo Codes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Promo code status updated successfully
 *       404:
 *         description: Promo code not found
 */
router.patch(
  '/:id/toggle-status',
  adminAuth,
  clearRouteCache('promo_codes_*'),
  promoCodeController.togglePromoCodeStatus
);

/**
 * @swagger
 * /promocodes/validate:
 *   post:
 *     summary: Validate a promo code
 *     tags: [Promo Codes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - cartTotal
 *             properties:
 *               code:
 *                 type: string
 *               cartTotal:
 *                 type: number
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Promo code validation result
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Promo code not found
 */
router.post(
  '/validate',
  userAuth,
  promoCodeController.validatePromoCode
);

/**
 * @swagger
 * /promocodes/{id}/analytics:
 *   get:
 *     summary: Get promo code analytics
 *     tags: [Promo Codes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Promo code analytics data
 *       404:
 *         description: Promo code not found
 */
router.get(
  '/:id/analytics',
  adminAuth,
  cacheRoute(300),
  promoCodeController.getPromoCodeAnalytics
);

module.exports = router;
