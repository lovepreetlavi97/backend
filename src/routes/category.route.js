const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
// const { uploadSingleImage } = require("../middlewares/multerUploads");
const { adminAuth, userAuth } = require('../middlewares/auth/auth.middleware');
const { uploadMultipleImages } = require("../middlewares/multerUploads");
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
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional array of image files. If not provided, a default image will be used.
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/',adminAuth, uploadMultipleImages, categoryController.createCategory);
/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Category]
 *     security:
 *       - BearerAuth: [] 
 *     responses:
 *       200:
 *         description: A list of categories
 */
router.get('/',adminAuth, categoryController.getAllCategories);

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
 *                 description: The updated name of the category.
 *                 example: "Necklaces"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional updated array of image files. If not provided, the existing images will be retained.
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       404:
 *         description: Category not found
 *       400:
 *         description: Bad request
 */
router.put('/:id',adminAuth,uploadMultipleImages, categoryController.updateCategoryById);

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
 *       204:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 */
router.delete('/:id', adminAuth, categoryController.deleteCategoryById);

module.exports = router;
