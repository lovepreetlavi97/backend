const express = require("express");
const router = express.Router();
const subcategoryController = require("../controllers/subcategory.controller");
const { uploadSingleImage } = require("../middlewares/multerUploads");
const { adminAuth, userAuth } = require('../middlewares/auth/auth.middleware');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Enter your bearer token in the format **Bearer &lt;token&gt;**
 */

/**
 * @swagger
 * tags:
 *   - name: Subcategory
 *     description: Subcategory management endpoints
 */

/**
 * @swagger
 * /subcategories:
 *   post:
 *     summary: Create a new subcategory
 *     tags: [Subcategory]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 required: true
 *                 example: "Jewelry"
 *               category:
 *                 type: string
 *                 description: ObjectId of the parent category
 *                 example: "60d5ec49c2e6b218a8c02011"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Category image file
 *     responses:
 *       201:
 *         description: Subcategory created successfully
 *       400:
 *         description: Bad request - invalid input
 *       500:
 *         description: Server error
 */
router.post("/", adminAuth, uploadSingleImage, subcategoryController.createSubcategory);

/**
 * @swagger
 * /subcategories:
 *   get:
 *     summary: Get all subcategories
 *     tags: [Subcategory]
 *     security:
 *       - BearerAuth: []
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
 *         name: isBlocked
 *         schema:
 *           type: boolean
 *         description: Filter by blocked status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by subcategory name
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *     responses:
 *       200:
 *         description: A list of subcategories
 *       500:
 *         description: Server error
 */
router.get("/", adminAuth, subcategoryController.getAllSubcategories);

/**
 * @swagger
 * /subcategories/{id}:
 *   get:
 *     summary: Get a subcategory by ID
 *     tags: [Subcategory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the subcategory
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subcategory details
 *       404:
 *         description: Subcategory not found
 *       500:
 *         description: Server error
 */
router.get("/:id", adminAuth, subcategoryController.getSubcategoryById);

/**
 * @swagger
 * /subcategories/{id}:
 *   put:
 *     summary: Update a subcategory by ID
 *     tags: [Subcategory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the subcategory
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The updated name of the subcategory
 *               category:
 *                 type: string
 *                 description: Updated category ID
 *               isBlocked:
 *                 type: boolean
 *                 description: Blocked status of the subcategory
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Updated subcategory image
 *     responses:
 *       200:
 *         description: Subcategory updated successfully
 *       404:
 *         description: Subcategory not found
 *       500:
 *         description: Server error
 */
router.put("/:id", adminAuth, uploadSingleImage, subcategoryController.updateSubcategoryById);

/**
 * @swagger
 * /subcategories/{id}/toggle-status:
 *   put:
 *     summary: Toggle subcategory blocked status
 *     tags: [Subcategory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the subcategory
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subcategory status updated successfully
 *       404:
 *         description: Subcategory not found
 *       500:
 *         description: Server error
 */
router.put("/:id/toggle-status", adminAuth, subcategoryController.toggleSubcategoryStatus);

/**
 * @swagger
 * /subcategories/{id}:
 *   delete:
 *     summary: Delete a subcategory by ID
 *     tags: [Subcategory]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the subcategory
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subcategory deleted successfully
 *       404:
 *         description: Subcategory not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", adminAuth, subcategoryController.deleteSubcategoryById);

module.exports = router;
