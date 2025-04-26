const express = require('express');
const router = express.Router();
const relationController = require('../controllers/relation.controller');
const { uploadMultipleImages } = require("../middlewares/multerUploads");
const { adminAuth, userAuth } = require('../middlewares/auth/auth.middleware');
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
 *                 description: The name of the relation.
 *                 example: "Friend"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional array of image files. If not provided, a default image will be used.
 *     responses:
 *       201:
 *         description: Relation created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', adminAuth, uploadMultipleImages, relationController.createRelation);
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
router.get('/', adminAuth,relationController.getAllRelations);

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
router.get('/:id',adminAuth, relationController.getRelationById);



/**
 * @swagger
 * /relations/{id}:
 *   put:
 *     summary: Update a relation by ID
 *     tags: [Relation]
 *     security:
 *       - BearerAuth: []
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The updated name of the relation.
 *                 example: "Colleague"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional array of image files. If not provided, the current images will be retained.
 *     responses:
 *       200:
 *         description: Relation updated successfully
 *       404:
 *         description: Relation not found
 */
router.put('/:id', adminAuth, uploadMultipleImages, relationController.updateRelationById);

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
router.delete('/:id', adminAuth,relationController.deleteRelationById);

module.exports = router;
