const express = require('express');
const router = express.Router();
const { priceRuleController } = require('../controllers');
const { adminAuth } = require('../middlewares/auth/auth.middleware');
const { cacheRoute, clearRouteCache } = require('../middlewares/cache/cache.middleware');

/**
 * @swagger
 * tags:
 *   name: PriceRules
 *   description: Price rule management
 */

/**
 * @swagger
 * /prices:
 *   post:
 *     summary: Create a new price rule
 *     tags: [PriceRules]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - type
 *               - value
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [fixed, percentage]
 *               value:
 *                 type: number
 *               categoryId:
 *                 type: string
 *               subcategoryId:
 *                 type: string
 *               productId:
 *                 type: string
 *               minOrderValue:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Price rule created successfully
 *       400:
 *         description: Bad request
 */
router.post(
  '/',
  adminAuth,
  clearRouteCache('price_rules_*'),
  priceRuleController.createPriceRule
);

/**
 * @swagger
 * /prices:
 *   get:
 *     summary: Get all price rules
 *     tags: [PriceRules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name or description
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [fixed, percentage]
 *         description: Filter by type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of price rules
 */
router.get(
  '/',
  adminAuth,
  cacheRoute('price_rules_', 300),
  priceRuleController.getAllPriceRules
);

/**
 * @swagger
 * /prices/{id}:
 *   get:
 *     summary: Get a price rule by ID
 *     tags: [PriceRules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Price rule ID
 *     responses:
 *       200:
 *         description: Price rule details
 *       404:
 *         description: Price rule not found
 */
router.get(
  '/:id',
  adminAuth,
  priceRuleController.getPriceRuleById
);

/**
 * @swagger
 * /prices/{id}:
 *   put:
 *     summary: Update a price rule
 *     tags: [PriceRules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Price rule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [fixed, percentage]
 *               value:
 *                 type: number
 *               categoryId:
 *                 type: string
 *               subcategoryId:
 *                 type: string
 *               productId:
 *                 type: string
 *               minOrderValue:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Price rule updated successfully
 *       404:
 *         description: Price rule not found
 */
router.put(
  '/:id',
  adminAuth,
  clearRouteCache('price_rules_*'),
  priceRuleController.updatePriceRuleById
);

/**
 * @swagger
 * /prices/{id}:
 *   delete:
 *     summary: Delete a price rule
 *     tags: [PriceRules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Price rule ID
 *     responses:
 *       200:
 *         description: Price rule deleted successfully
 *       404:
 *         description: Price rule not found
 */
router.delete(
  '/:id',
  adminAuth,
  clearRouteCache('price_rules_*'),
  priceRuleController.deletePriceRuleById
);

/**
 * @swagger
 * /prices/{id}/toggle-status:
 *   patch:
 *     summary: Toggle price rule active status
 *     tags: [PriceRules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Price rule ID
 *     responses:
 *       200:
 *         description: Price rule status toggled successfully
 *       404:
 *         description: Price rule not found
 */
router.patch(
  '/:id/toggle-status',
  adminAuth,
  clearRouteCache('price_rules_*'),
  priceRuleController.togglePriceRuleStatus
);

module.exports = router;
