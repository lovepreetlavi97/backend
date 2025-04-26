const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contact.controller");
const { adminAuth } = require('../middlewares/auth/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Contacts
 *   description: Contact form management
 */

/**
 * @swagger
 * /contacts:
 *   post:
 *     summary: Submit a contact form
 *     tags: [Contacts]
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
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Contact form submitted successfully
 */
router.post("/", contactController.createContact);

/**
 * @swagger
 * /contacts:
 *   get:
 *     summary: Get all contact submissions
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all contact submissions
 */
router.get("/", adminAuth, contactController.getAllContacts);

/**
 * @swagger
 * /contacts/{id}:
 *   get:
 *     summary: Get a contact submission by ID
 *     tags: [Contacts]
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
 *         description: Contact submission retrieved successfully
 */
router.get("/:id", adminAuth, contactController.getContactById);

/**
 * @swagger
 * /contacts/{id}/status:
 *   put:
 *     summary: Update contact status
 *     tags: [Contacts]
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
 *                 enum: ['Pending', 'Resolved']
 *     responses:
 *       200:
 *         description: Contact status updated successfully
 */
router.put("/:id/status", adminAuth, contactController.updateContactStatus);

/**
 * @swagger
 * /contacts/{id}:
 *   delete:
 *     summary: Delete a contact submission
 *     tags: [Contacts]
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
 *         description: Contact deleted successfully
 */
router.delete("/:id", adminAuth, contactController.deleteContact);

module.exports = router;
