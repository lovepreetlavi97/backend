const express = require('express');
const router = express.Router();
const { socialIntegrationController } = require('../controllers');
const { adminAuth, userAuth } = require('../middlewares/auth/auth.middleware');
const { cacheRoute, clearRouteCache } = require('../middlewares/cache/cache.middleware');

/**
 * @swagger
 * /social:
 *   get:
 *     summary: Get all social integrations
 *     tags: [Social Integrations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of social integrations
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  adminAuth,
  cacheRoute(300),
  socialIntegrationController.getAllIntegrations
);

/**
 * @swagger
 * /social/{id}:
 *   get:
 *     summary: Get social integration by ID
 *     tags: [Social Integrations]
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
 *         description: Social integration details
 *       404:
 *         description: Integration not found
 */
router.get(
  '/:id',
  adminAuth,
  socialIntegrationController.getIntegrationById
);

/**
 * @swagger
 * /social:
 *   post:
 *     summary: Create new social integration
 *     tags: [Social Integrations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - platform
 *               - name
 *             properties:
 *               platform:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Integration created successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  '/',
  adminAuth,
  clearRouteCache('social_integrations_*'),
  socialIntegrationController.createIntegration
);

/**
 * @swagger
 * /social/{id}:
 *   put:
 *     summary: Update social integration
 *     tags: [Social Integrations]
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
 *             type: object
 *     responses:
 *       200:
 *         description: Integration updated successfully
 *       404:
 *         description: Integration not found
 */
router.put(
  '/:id',
  adminAuth,
  clearRouteCache('social_integrations_*'),
  socialIntegrationController.updateIntegration
);

/**
 * @swagger
 * /social/{id}/toggle:
 *   patch:
 *     summary: Toggle social integration status
 *     tags: [Social Integrations]
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
 *         description: Integration status updated successfully
 *       404:
 *         description: Integration not found
 */
router.patch(
  '/:id/toggle',
  adminAuth,
  clearRouteCache('social_integrations_*'),
  socialIntegrationController.toggleIntegration
);

/**
 * @swagger
 * /social/{id}/feature:
 *   patch:
 *     summary: Update feature settings
 *     tags: [Social Integrations]
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
 *             type: object
 *             required:
 *               - feature
 *               - enabled
 *             properties:
 *               feature:
 *                 type: string
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Feature updated successfully
 *       404:
 *         description: Integration not found
 */
router.patch(
  '/:id/feature',
  adminAuth,
  clearRouteCache('social_integrations_*'),
  socialIntegrationController.updateFeature
);

/**
 * @swagger
 * /social/{id}:
 *   delete:
 *     summary: Delete social integration
 *     tags: [Social Integrations]
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
 *         description: Integration deleted successfully
 *       404:
 *         description: Integration not found
 */
router.delete(
  '/:id',
  adminAuth,
  clearRouteCache('social_integrations_*'),
  socialIntegrationController.deleteIntegration
);

/**
 * @swagger
 * /social/{id}/sync:
 *   post:
 *     summary: Sync social integration stats
 *     tags: [Social Integrations]
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
 *         description: Integration stats synced successfully
 *       404:
 *         description: Integration not found
 */
router.post(
  '/:id/sync',
  adminAuth,
  clearRouteCache('social_integrations_*'),
  socialIntegrationController.syncIntegrationStats
);

module.exports = router; 