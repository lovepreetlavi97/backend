const express = require('express');
const router = express.Router();
const relationController = require('../controllers/relation.controller');

/**
 * @swagger
 * tags:
 *   name: Relation
 *   description: Relation management
 */

/**
 * @swagger
 * /relations:
 *   post:
 *     summary: Create a new relation
 *     tags: [Relation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional array of image URLs. If not provided, a default image will be used.
 *     responses:
 *       201:
 *         description: Relation created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', relationController.createRelation);

/**
 * @swagger
 * /relations:
 *   get:
 *     summary: Get all relations
 *     tags: [Relation]
 *     responses:
 *       200:
 *         description: A list of relations
 */
router.get('/', relationController.getAllRelations);

/**
 * @swagger
 * /relations/{id}:
 *   get:
 *     summary: Get a relation by ID
 *     tags: [Relation]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the relation
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Relation details
 *       404:
 *         description: Relation not found
 */
router.get('/:id', relationController.getRelationById);

/**
 * @swagger
 * /relations/{id}:
 *   put:
 *     summary: Update a relation by ID
 *     tags: [Relation]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the relation
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
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional array of image URLs. If not provided, a default image will be used.
 *     responses:
 *       200:
 *         description: Relation updated successfully
 *       404:
 *         description: Relation not found
 */
router.put('/:id', relationController.updateRelationById);

/**
 * @swagger
 * /relations/{id}:
 *   delete:
 *     summary: Delete a relation by ID
 *     tags: [Relation]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the relation
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Relation deleted successfully
 *       404:
 *         description: Relation not found
 */
router.delete('/:id', relationController.deleteRelationById);

module.exports = router;
