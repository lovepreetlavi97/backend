const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdmin.controller');
const { superAdminAuth } = require('../middlewares/auth/auth.middleware');
const { clearRouteCache } = require('../middlewares/cache/cache.middleware');

/**
 * @swagger
 * tags:
 *   name: SuperAdmin
 *   description: SuperAdmin management (restricted access)
 */

/**
 * @swagger
 * /superadmin/admin:
 *   post:
 *     summary: Create a new admin (SuperAdmin only)
 *     tags: [SuperAdmin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: securePassword123
 *               permissions:
 *                 type: object
 *                 properties:
 *                   manageProducts:
 *                     type: boolean
 *                     example: true
 *                   manageCategories:
 *                     type: boolean
 *                     example: true
 *                   manageOrders:
 *                     type: boolean
 *                     example: true
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       409:
 *         description: Admin with this email already exists
 *       500:
 *         description: Failed to create admin
 */
router.post('/admin', superAdminAuth, clearRouteCache('route_/api/v1/admin*'), superAdminController.createAdmin);

/**
 * @swagger
 * /superadmin/admins:
 *   get:
 *     summary: Get all admins (SuperAdmin only)
 *     tags: [SuperAdmin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admins retrieved successfully
 *       500:
 *         description: Failed to retrieve admins
 */
router.get('/admins', superAdminAuth, superAdminController.getAllAdmins);

/**
 * @swagger
 * /superadmin/admin/{id}:
 *   get:
 *     summary: Get admin by ID (SuperAdmin only)
 *     tags: [SuperAdmin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Admin retrieved successfully
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Failed to retrieve admin
 */
router.get('/admin/:id', superAdminAuth, superAdminController.getAdminById);

/**
 * @swagger
 * /superadmin/admin/{id}:
 *   put:
 *     summary: Update admin (SuperAdmin only)
 *     tags: [SuperAdmin]
 *     security:
 *       - BearerAuth: []
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
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               permissions:
 *                 type: object
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *       404:
 *         description: Admin not found
 *       409:
 *         description: Email already in use
 *       500:
 *         description: Failed to update admin
 */
router.put('/admin/:id', superAdminAuth, clearRouteCache('route_/api/v1/admin*'), superAdminController.updateAdmin);

/**
 * @swagger
 * /superadmin/admin/{id}:
 *   delete:
 *     summary: Delete admin (SuperAdmin only)
 *     tags: [SuperAdmin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Admin deleted successfully
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Failed to delete admin
 */
router.delete('/admin/:id', superAdminAuth, clearRouteCache('route_/api/v1/admin*'), superAdminController.deleteAdmin);

/**
 * @swagger
 * /superadmin/setup:
 *   post:
 *     summary: Create a SuperAdmin (initial setup)
 *     tags: [SuperAdmin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               secretKey:
 *                 type: string
 *                 description: Secret key from environment variables
 *     responses:
 *       201:
 *         description: SuperAdmin created successfully
 *       403:
 *         description: Invalid secret key
 *       409:
 *         description: A SuperAdmin already exists
 *       500:
 *         description: Failed to create SuperAdmin
 */
router.post('/setup', superAdminController.createSuperAdmin);

module.exports = router; 