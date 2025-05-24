const express = require('express');
const router = express.Router();
const { grievanceController } = require('../controllers');
const { adminAuth, userAuth } = require('../middlewares/auth/auth.middleware');
const { uploadMultipleImages } = require('../middlewares/multerUploads');
const { cacheRoute, clearRouteCache } = require('../middlewares/cache/cache.middleware');

/**
 * @swagger
 * /grievances:
 *   get:
 *     summary: Get all grievances with pagination and filtering
 *     tags: [Grievances]
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
 *         description: Search term for subject, description, or order number
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [product, delivery, service, payment, other]
 *         description: Filter by grievance type
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [high, medium, low]
 *         description: Filter by priority
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *         description: Filter by status
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
 *         description: List of grievances
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  adminAuth,
  cacheRoute(300),
  grievanceController.getAllGrievances
);

/**
 * @swagger
 * /grievances/{id}:
 *   get:
 *     summary: Get a grievance by ID
 *     tags: [Grievances]
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
 *         description: Grievance details
 *       404:
 *         description: Grievance not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:id',
  adminAuth,
  grievanceController.getGrievanceById
);

/**
 * @swagger
 * /grievances:
 *   post:
 *     summary: Create a new grievance
 *     tags: [Grievances]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - type
 *               - subject
 *               - description
 *             properties:
 *               userId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [product, delivery, service, payment, other]
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [high, medium, low]
 *               orderNumber:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Grievance created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  userAuth,
  uploadMultipleImages,
  clearRouteCache('grievances_*'),
  grievanceController.createGrievance
);

/**
 * @swagger
 * /grievances/{id}/status:
 *   patch:
 *     summary: Update grievance status
 *     tags: [Grievances]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved, closed]
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Grievance not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/:id/status',
  adminAuth,
  clearRouteCache('grievances_*'),
  clearRouteCache('grievance_*'),
  grievanceController.updateStatus
);

/**
 * @swagger
 * /grievances/{id}/priority:
 *   patch:
 *     summary: Update grievance priority
 *     tags: [Grievances]
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
 *               - priority
 *             properties:
 *               priority:
 *                 type: string
 *                 enum: [high, medium, low]
 *     responses:
 *       200:
 *         description: Priority updated successfully
 *       400:
 *         description: Invalid priority
 *       404:
 *         description: Grievance not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/:id/priority',
  adminAuth,
  clearRouteCache('grievances_*'),
  clearRouteCache('grievance_*'),
  grievanceController.updatePriority
);

/**
 * @swagger
 * /grievances/{id}/replies:
 *   post:
 *     summary: Add a reply to a grievance
 *     tags: [Grievances]
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
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reply added successfully
 *       400:
 *         description: Message is required
 *       404:
 *         description: Grievance not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/replies',
  userAuth,
  clearRouteCache('grievances_*'),
  clearRouteCache('grievance_*'),
  grievanceController.addReply
);

/**
 * @swagger
 * /grievances/{id}/assign:
 *   patch:
 *     summary: Assign grievance to an admin
 *     tags: [Grievances]
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
 *               - adminId
 *             properties:
 *               adminId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Grievance assigned successfully
 *       400:
 *         description: Admin ID is required
 *       404:
 *         description: Grievance not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/:id/assign',
  adminAuth,
  clearRouteCache('grievances_*'),
  clearRouteCache('grievance_*'),
  grievanceController.assignGrievance
);

/**
 * @swagger
 * /grievances/{id}:
 *   delete:
 *     summary: Delete a grievance (soft delete)
 *     tags: [Grievances]
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
 *         description: Grievance deleted successfully
 *       404:
 *         description: Grievance not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  adminAuth,
  clearRouteCache('grievances_*'),
  clearRouteCache('grievance_*'),
  grievanceController.deleteGrievance
);

/**
 * @swagger
 * /grievances/analytics:
 *   get:
 *     summary: Get grievance analytics
 *     tags: [Grievances]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Grievance analytics
 *       500:
 *         description: Server error
 */
router.get(
  '/analytics',
  adminAuth,
  cacheRoute(600),
  grievanceController.getGrievanceAnalytics
);

module.exports = router;
