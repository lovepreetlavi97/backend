const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/v1/admin.controller');

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
 *     summary: Create a new admin
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
 *     summary: Get all admins
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: A list of admins
 */
router.get('/', adminController.getAllAdmins);

/**
 * @swagger
 * /admin/{id}:
 *   get:
 *     summary: Get an admin by ID
 *     tags: [Admin]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the admin
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Admin details
 *       404:
 *         description: Admin not found
 */
router.get('/:id', adminController.getAdminById);

/**
 * @swagger
 * /admin/{id}:
 *   put:
 *     summary: Update an admin by ID
 *     tags: [Admin]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the admin
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
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *       404:
 *         description: Admin not found
 */
router.put('/:id', adminController.updateAdminById);

/**
 * @swagger
 * /admin/{id}:
 *   delete:
 *     summary: Delete an admin by ID
 *     tags: [Admin]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the admin
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Admin deleted successfully
 *       404:
 *         description: Admin not found
 */
router.delete('/:id', adminController.deleteAdminById);

module.exports = router;
