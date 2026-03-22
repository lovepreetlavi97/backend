const express = require("express");
const router = express.Router();
const curatedController = require("../controllers/curatedCollection.controller");
const { uploadSingleImage } = require("../middlewares/uploadMiddleware");
const { adminAuth } = require("../middlewares/auth/auth.middleware");

/**
 * PUBLIC endpoint — no auth required
 * Returns active collections for navbar dropdown and product form
 */
router.get("/public", curatedController.getPublicCollections);

/**
 * @swagger
 * tags:
 *   name: CuratedCollection
 *   description: Curated collection management
 */

/**
 * @swagger
 * /curated-collections:
 *   post:
 *     summary: Create a new curated collection
 *     tags: [CuratedCollection]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - filters
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Gifts for Men"
 *               filters:
 *                 type: string
 *                 description: JSON string of filters
 *                 example: '{"relationIds":["id1","id2"],"priceRange":{"max":50000}}'
 *               position:
 *                 type: number
 *                 example: 1
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Curated collection created successfully
 *       400:
 *         description: Bad request
 */
router.post(
  "/",
  adminAuth,
  uploadSingleImage,
  curatedController.createCuratedCollection
);

/**
 * @swagger
 * /curated-collections:
 *   get:
 *     summary: Get all curated collections (Admin)
 *     tags: [CuratedCollection]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Curated collections fetched successfully
 */
router.get(
  "/",
  adminAuth,
  curatedController.getAllCuratedCollections
);

/**
 * @swagger
 * /curated-collections/{id}:
 *   get:
 *     summary: Get curated collection by ID
 *     tags: [CuratedCollection]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Curated collection details
 *       404:
 *         description: Curated collection not found
 */
router.get(
  "/:id",
  adminAuth,
  curatedController.getCuratedCollectionById
);

/**
 * @swagger
 * /curated-collections/{id}:
 *   put:
 *     summary: Update curated collection by ID
 *     tags: [CuratedCollection]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
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
 *               filters:
 *                 type: string
 *                 example: '{"relationIds":["id1"],"priceRange":{"min":3000,"max":40000}}'
 *               position:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Curated collection updated successfully
 *       404:
 *         description: Curated collection not found
 */
router.put(
  "/:id",
  adminAuth,
  uploadSingleImage,
  curatedController.updateCuratedCollectionById
);

/**
 * @swagger
 * /curated-collections/{id}:
 *   delete:
 *     summary: Delete curated collection (soft delete)
 *     tags: [CuratedCollection]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Curated collection deleted successfully
 */
router.delete(
  "/:id",
  adminAuth,
  curatedController.deleteCuratedCollectionById
);

/**
 * @swagger
 * /curated-collections/{id}/toggle-status:
 *   patch:
 *     summary: Toggle curated collection active status
 *     tags: [CuratedCollection]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Curated collection status toggled successfully
 */
router.patch(
  "/:id/toggle-status",
  adminAuth,
  curatedController.toggleCuratedCollectionStatus
);

/**
 * @swagger
 * /curated-collections/slug/{slug}/products:
 *   get:
 *     summary: Get products for a curated collection (User side)
 *     tags: [CuratedCollection]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: gifts-for-men
 *     responses:
 *       200:
 *         description: Curated products fetched successfully
 *       404:
 *         description: Curated collection not found
 */
router.get(
  "/slug/:slug/products",
  curatedController.getCuratedCollectionProducts
);

module.exports = router;
