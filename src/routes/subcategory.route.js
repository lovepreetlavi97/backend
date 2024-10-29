const express = require('express');
const router = express.Router();
const subcategoryController = require('../controllers/subcategory.controller');

/**
 * @swagger
 * tags:
 *   name: Subcategories
 *   description: Subcategory management
 */

/**
 * @swagger
 * path:
 *  /api/v1/subcategories:
 *    post:
 *      summary: Create a new subcategory
 *      tags: [Subcategories]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                name:
 *                  type: string
 *                  example: "Jewelry"
 *                category:
 *                  type: string
 *                  format: ObjectId
 *                  example: "60d5ec49c2e6b218a8c02011"  # Example category ID
 *      responses:
 *        201:
 *          description: Created subcategory
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  _id:
 *                    type: string
 *                    example: "60d5ec49c2e6b218a8c02012"
 *                  name:
 *                    type: string
 *                  category:
 *                    type: string
 *        400:
 *          description: Bad Request
 */
router.post('/', subcategoryController.createSubcategory);

/**
 * @swagger
 * path:
 *  /api/v1/subcategories:
 *    get:
 *      summary: Get all subcategories
 *      tags: [Subcategories]
 *      responses:
 *        200:
 *          description: List of subcategories
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  type: object
 *                  properties:
 *                    _id:
 *                      type: string
 *                    name:
 *                      type: string
 *                    category:
 *                      type: string
 *        500:
 *          description: Server error
 */
router.get('/', subcategoryController.getAllSubcategories);

/**
 * @swagger
 * path:
 *  /api/v1/subcategories/{id}:
 *    get:
 *      summary: Get a subcategory by ID
 *      tags: [Subcategories]
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          description: ID of the subcategory
 *          schema:
 *            type: string
 *      responses:
 *        200:
 *          description: Subcategory found
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  _id:
 *                    type: string
 *                  name:
 *                    type: string
 *                  category:
 *                    type: string
 *        404:
 *          description: Subcategory not found
 *        500:
 *          description: Server error
 */
router.get('/:id', subcategoryController.getSubcategoryById);

/**
 * @swagger
 * path:
 *  /api/v1/subcategories/{id}:
 *    put:
 *      summary: Update a subcategory by ID
 *      tags: [Subcategories]
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          description: ID of the subcategory
 *          schema:
 *            type: string
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                name:
 *                  type: string
 *                category:
 *                  type: string
 *      responses:
 *        200:
 *          description: Updated subcategory
 *        404:
 *          description: Subcategory not found
 *        400:
 *          description: Bad Request
 */
router.put('/:id', subcategoryController.updateSubcategoryById);

/**
 * @swagger
 * path:
 *  /api/v1/subcategories/{id}:
 *    delete:
 *      summary: Delete a subcategory by ID
 *      tags: [Subcategories]
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          description: ID of the subcategory
 *          schema:
 *            type: string
 *      responses:
 *        204:
 *          description: Subcategory deleted
 *        404:
 *          description: Subcategory not found
 *        500:
 *          description: Server error
 */
router.delete('/:id', subcategoryController.deleteSubcategoryById);

module.exports = router;
