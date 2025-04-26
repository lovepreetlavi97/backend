const express = require("express");
const router = express.Router();
const subcategoryController = require("../controllers/subcategory.controller");
const { uploadMultipleImages } = require("../middlewares/multerUploads");
const { adminAuth, userAuth } = require('../middlewares/auth/auth.middleware');
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
 *                 example: "Jewelry"
 *               category:
 *                 type: string
 *                 description: ObjectId of the parent category
 *                 example: "60d5ec49c2e6b218a8c02011"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional array of image files. If not provided, a default image will be used.
 *     responses:
 *       201:
 *         description: Subcategory created successfully
 *       400:
 *         description: Bad request - invalid input
 *       500:
 *         description: Server error
 */
router.post("/",adminAuth,uploadMultipleImages, subcategoryController.createSubcategory);

/**
 * @swagger
 * /subcategories:
 *   get:
 *     summary: Get all subcategories
 *     tags: [Subcategory]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of subcategories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     example: "60d5ec49c2e6b218a8c02012"
 *                   name:
 *                     type: string
 *                     example: "Jewelry"
 *                   category:
 *                     type: string
 *                     example: "60d5ec49c2e6b218a8c02011"
 *       500:
 *         description: Server error
 */
router.get("/",adminAuth, subcategoryController.getAllSubcategories);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   example: "60d5ec49c2e6b218a8c02012"
 *                 name:
 *                   type: string
 *                   example: "Jewelry"
 *                 category:
 *                   type: string
 *                   example: "60d5ec49c2e6b218a8c02011"
 *       404:
 *         description: Subcategory not found
 *       500:
 *         description: Server error
 */
router.get("/:id",adminAuth, subcategoryController.getSubcategoryById);
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
 *                 example: "Accessories"
 *               category:
 *                 type: string
 *                 example: "60d5ec49c2e6b218a8c02011"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional array of image files. If not provided, a default image will be used.
 *     responses:
 *       200:
 *         description: Subcategory updated successfully
 *       400:
 *         description: Bad request - invalid input
 *       404:
 *         description: Subcategory not found
 *       500:
 *         description: Server error
 */
router.put("/:id",adminAuth,uploadMultipleImages, subcategoryController.updateSubcategoryById);

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
 *       204:
 *         description: Subcategory deleted successfully
 *       404:
 *         description: Subcategory not found
 *       500:
 *         description: Server error
 */
router.delete("/:id",adminAuth, subcategoryController.deleteSubcategoryById);

module.exports = router;
