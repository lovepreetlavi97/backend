const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { uploadProductImages } = require("../middlewares/multerUploads");
const { adminAuth, userAuth } = require('../middlewares/auth/auth.middleware');
/**
 * @swagger
 * tags:
 *   name: Product
 *   description: Product management
 */
/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Product]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the product.
 *                 example: "Gold Chain"
 *               actualPrice:
 *                 type: number
 *                 description: The actual price of the product.
 *                 example: 50000
 *               discountedPrice:
 *                 type: number
 *                 description: The discounted price of the product (optional).
 *                 example: 45000
 *               weight:
 *                 type: number
 *                 description: Weight of the product in grams.
 *                 example: 10
 *               categoryId:
 *                 type: string
 *                 description: The ID of the category the product belongs to.
 *                 example: "64f5e3c5a2e1b6d7889a1234"
 *               subcategoryId:
 *                 type: string
 *                 description: The ID of the subcategory (optional).
 *                 example: "64f5e3c5a2e1b6d7889a5678"
 *               festivalIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of festival IDs (optional).
 *                 example: ["64f5e3c5a2e1b6d7889a6789"]
 *               relationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of related product IDs (optional).
 *                 example: ["64f5e3c5a2e1b6d7889a9999"]
 *               tags:
 *                 type: string
 *                 enum: [New, Sale, Bestseller]
 *                 description: Product tag (New, Sale, or Bestseller).
 *                 default: New
 *                 example: "New"
 *               specifications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     value:
 *                       type: string
 *                 description: Array of product specifications.
 *                 example: [{name: "Material", value: "Gold"}, {name: "Purity", value: "24K"}]
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Main product image
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Additional product images (multiple files allowed)
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post("/", adminAuth, uploadProductImages, productController.createProduct);
/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: A list of products
 */
router.get('/', adminAuth, productController.getAllProducts);
/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     tags: [Product]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the product
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/:id', adminAuth, productController.getProductById);
/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product by ID
 *     tags: [Product]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the product to be updated
 *         schema:
 *           type: string
 *           example: "607d1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the product.
 *                 example: "Wireless Keyboard"
 *               actualPrice:
 *                 type: number
 *                 description: The actual price of the product.
 *                 example: 40.99
 *               discountedPrice:
 *                 type: number
 *                 description: The discounted price of the product (optional).
 *                 example: 35.99
 *               weight:
 *                 type: number
 *                 description: The weight of the product in kilograms.
 *                 example: 0.5
 *               categoryId:
 *                 type: string
 *                 description: The ID of the category the product belongs to.
 *                 example: "607d1f77bcf86cd799439011"
 *               subcategoryId:
 *                 type: string
 *                 description: The ID of the subcategory (optional).
 *                 example: "607d1f77bcf86cd799439022"
 *               festivalIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of festival IDs (optional).
 *                 example: ["607d1f77bcf86cd799439033"]
 *               relationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of related product IDs.
 *                 example: ["607d1f77bcf86cd799439044"]
 *               tags:
 *                 type: string
 *                 enum: [New, Sale, Bestseller]
 *                 description: Product tag (New, Sale, or Bestseller).
 *                 default: New
 *                 example: "New"
 *               specifications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     value:
 *                       type: string
 *                 description: Array of product specifications.
 *                 example: [{name: "Material", value: "Gold"}, {name: "Purity", value: "24K"}]
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Main product image
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Additional product images (multiple files allowed)
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', adminAuth, uploadProductImages, productController.updateProductById);
/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product by ID
 *     tags: [Product]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the product
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
router.delete('/:id', adminAuth, productController.deleteProductById);
/**
 * @swagger
 * /products/{id}/toggle-block:
 *   put:
 *     summary: Toggle block/unblock status of a product
 *     tags: [Product]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the product
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product status updated successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id/toggle-block', adminAuth, productController.toggleBlockStatus);
module.exports = router;
