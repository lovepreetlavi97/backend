const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { adminAuth, superAdminAuth, adminOrSuperAdminAuth, checkPermission } = require('../middlewares/auth/auth.middleware');
const { cacheRoute, clearRouteCache } = require('../middlewares/cache/cache.middleware');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management
 */

/**
 * @swagger
 * /admin:
 *   post:
 *     summary: Create a new admin (SuperAdmin only)
 *     tags: [Admin]
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
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', adminController.createAdmin);

/**
 * @swagger
 * /admin:
 *   get:
 *     summary: Get all admins (requires manageAdmins permission)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of admins
 */
router.get('/', adminOrSuperAdminAuth, checkPermission('manageAdmins'), cacheRoute(), adminController.getAllAdmins);

/**
 * @swagger
 * /admin/{id}:
 *   get:
 *     summary: Get an admin by ID (requires manageAdmins permission)
 *     tags: [Admin]
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
 *         description: Admin details
 *       404:
 *         description: Admin not found
 */
router.get('/:id', adminOrSuperAdminAuth, checkPermission('manageAdmins'), cacheRoute(), adminController.getAdminById);

/**
 * @swagger
 * /admin/{id}:
 *   put:
 *     summary: Update an admin (requires manageAdmins permission)
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *       404:
 *         description: Admin not found
 */
router.put('/:id', adminOrSuperAdminAuth, checkPermission('manageAdmins'), clearRouteCache('route_/api/v1/admin*'), adminController.updateAdminById);

/**
 * @swagger
 * /admin/{id}:
 *   delete:
 *     summary: Delete an admin (SuperAdmin only)
 *     tags: [Admin]
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
 */
router.delete('/:id', superAdminAuth, clearRouteCache('route_/api/v1/admin*'), adminController.deleteAdminById);

/**
 * @swagger
 * /admin/password:
 *   put:
 *     summary: Update admin password
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       401:
 *         description: Invalid old password
 */
router.put('/password/update', adminOrSuperAdminAuth, adminController.updateAdminPassword);

/**
* @swagger
 * /admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Login successful
 *       404:
 *         description: Admin not found
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', adminController.loginAdmin);

/**
* @swagger
 * /admin/logout:
 *   post:
 *     summary: Admin logout
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', adminOrSuperAdminAuth, adminController.logoutAdmin);

/**
* @swagger
 * /admin/user:
 *   post:
 *     summary: Create a new user (requires manageUsers permission)
 *     tags: [Admin]
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
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               countryCode:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       403:
 *         description: Insufficient permissions
 *       409:
 *         description: User with this email/phone already exists
 */
router.post('/user', adminOrSuperAdminAuth, checkPermission('manageUsers'), adminController.createUser);

module.exports = router;
