const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { adminAuth, userAuth } = require('../middlewares/auth/auth.middleware');
const { uploadSingleImage } = require("../middlewares/multerUploads");

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
 *   name: Category
 *   description: Category management
 */

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Category]
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
 *                 description: The name of the category.
 *                 example: "Rings"
 *               description:
 *                 type: string
 *                 description: Description of the category
 *                 example: "Rings are a type of jewelry that are worn on the finger."
 *               isFeatured:
 *                 type: boolean
 *                 description: Featured status of the category
 *                 example: true
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Category image file
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/', adminAuth, uploadSingleImage, categoryController.createCategory);

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Category]
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
 *         description: Search by category name
 *     responses:
 *       200:
 *         description: A list of categories
 */
router.get('/', adminAuth, categoryController.getAllCategories);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get a category by ID
 *     tags: [Category]
 *     security:
 *       - BearerAuth: [] 
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
 */
router.get('/:id', adminAuth, categoryController.getCategoryById);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update a category by ID
 *     tags: [Category]
 *     security:
 *       - BearerAuth: [] 
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the category
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
 *                 description: The updated name of the category
 *               description:
 *                 type: string
 *                 description: Updated description of the category
 *               isFeatured:
 *                 type: boolean
 *                 description: Featured status of the category
 *               isBlocked:
 *                 type: boolean
 *                 description: Blocked status of the category
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Updated category image
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 *       400:
 *         description: Bad request
 */
router.put('/:id', adminAuth, uploadSingleImage, categoryController.updateCategoryById);

/**
 * @swagger
 * /categories/{id}/toggle-status:
 *   put:
 *     summary: Toggle category blocked status
 *     tags: [Category]
 *     security:
 *       - BearerAuth: [] 
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category status updated successfully
 *       404:
 *         description: Category not found
 */
router.put('/:id/toggle-status', adminAuth, categoryController.toggleCategoryStatus);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category by ID
 *     tags: [Category]
 *     security:
 *       - BearerAuth: [] 
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 */
router.delete('/:id', adminAuth, categoryController.deleteCategoryById);

module.exports = router;
