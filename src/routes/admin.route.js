const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const userController = require('../controllers/user.controller');
const userExportController = require('../controllers/userExport.controller');
const productExportController = require('../controllers/productExport.controller');
const orderExportController = require('../controllers/orderExport.controller');
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
 * /admin/users:
 *   get:
 *     summary: Get all users (requires manageUsers permission)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users with pagination
 *       403:
 *         description: Insufficient permissions
 */
router.get('/users', adminOrSuperAdminAuth, cacheRoute(), userController.getAllUsers);

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
 * /admin/orders/export:
 *   get:
 *     summary: Export orders to Excel (requires manageOrders permission)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: paymentStatus
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: search
 *         schema: { type: string, description: 'Order number or userId' }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Excel file download
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: No orders found
 */
router.get('/orders/export', adminOrSuperAdminAuth, checkPermission('manageOrders'), orderExportController.exportOrdersToExcel);

/**
* @swagger
 * /admin/products/export:
 *   get:
 *     summary: Export products to Excel (requires manageProducts permission)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema: { type: string }
 *       - in: query
 *         name: subcategoryId
 *         schema: { type: string }
 *       - in: query
 *         name: festivalId
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: inStock
 *         schema: { type: string, enum: ["true","false"] }
 *       - in: query
 *         name: isFeatured
 *         schema: { type: string, enum: ["true","false"] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Excel file download
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: No products found
 */
router.get('/products/export', adminOrSuperAdminAuth, checkPermission('manageProducts'), productExportController.exportProductsToExcel);

/**
* @swagger
 * /admin/users/export:
 *   get:
 *     summary: Export all users to Excel (requires manageUsers permission)
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or phone
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Excel file download
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: No users found
 */
router.get('/users/export', adminOrSuperAdminAuth, checkPermission('manageUsers'), userExportController.exportUsersToExcel);

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
