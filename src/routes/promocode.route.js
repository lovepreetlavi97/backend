const express = require('express');
const router = express.Router();
const promoCodeController = require('../controllers/promocode.controller');
const { adminAuth, userAuth } = require('../middlewares/auth/auth.middleware');
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
 *     tags: [PromoCode]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               discountValue:
 *                 type: number
 *               maxDiscount:
 *                 type: number
 *               minOrderValue:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *               usageLimit:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Promo code created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', adminAuth, promoCodeController.createPromoCode);

/**
 * @swagger
 * /promocodes:
 *   get:
 *     summary: Get all promo codes
 *     tags: [PromoCode]
 *     responses:
 *       200:
 *         description: A list of promo codes
 */
router.get('/',adminAuth, promoCodeController.getAllPromoCodes);

/**
 * @swagger
 * /promocodes/{id}:
 *   get:
 *     summary: Get a promo code by ID
 *     tags: [PromoCode]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the promo code
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Promo code details
 *       404:
 *         description: Promo code not found
 */
router.get('/:id',adminAuth, promoCodeController.getPromoCodeById);

/**
 * @swagger
 * /promocodes/{id}:
 *   put:
 *     summary: Update a promo code by ID
 *     tags: [PromoCode]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the promo code
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               discountType:
 *                 type: string
 *                 enum: [percentage, fixed]
 *               discountValue:
 *                 type: number
 *               maxDiscount:
 *                 type: number
 *               minOrderValue:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *               usageLimit:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Promo code updated successfully
 *       404:
 *         description: Promo code not found
 */
router.put('/:id', adminAuth,promoCodeController.updatePromoCodeById);

/**
 * @swagger
 * /promocodes/{id}:
 *   delete:
 *     summary: Delete a promo code by ID
 *     tags: [PromoCode]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the promo code
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Promo code deleted successfully
 *       404:
 *         description: Promo code not found
 */
router.delete('/:id',adminAuth, promoCodeController.deletePromoCodeById);

module.exports = router;
