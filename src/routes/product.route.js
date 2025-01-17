const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

/**
 * @swagger
 * tags:
 *   name: Product
 *   description: Product management
 */

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
 *         application/json:
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
 *                 description: The discounted price of the product (if any).
 *                 example: 35.99
 *               weight:
 *                 type: number
 *                 description: The weight of the product in kilograms.
 *                 example: 0.5
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional array of image URLs. If not provided, a default image will be used.
 *               categoryId:
 *                 type: string
 *                 description: The ID of the category the product belongs to.
 *                 example: "607d1f77bcf86cd799439011"
 *               subcategoryId:
 *                 type: string
 *                 description: The ID of the subcategory the product belongs to (optional).
 *                 example: "607d1f77bcf86cd799439022"
 *               festivalIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: A list of festival IDs associated with the product (optional).
 *                 example: ["607d1f77bcf86cd799439033"]
 *               relationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: A list of related product IDs.
 *                 example: ["607d1f77bcf86cd799439044"]
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
router.put('/:id', productController.updateProductById);


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
router.get('/', productController.getAllProducts);

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
router.get('/:id', productController.getProductById);

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
 *         description: The ID of the product
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
 *               price:
 *                 type: number
 *               image:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional array of image URLs. If not provided, a default image will be used.
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */
router.put('/:id', productController.updateProductById);

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
router.delete('/:id', productController.deleteProductById);



/**
 * @swagger
 * /user/products:
 *   get:
 *     summary: Get all products
 *      tags: [User - API's]
 *     responses:
 *       200:
 *         description: A list of products
 */
router.get('/products', productController.getAllProducts);
module.exports = router;
