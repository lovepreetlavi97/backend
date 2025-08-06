const express = require("express");
const router = express.Router();
const { festivalController } = require("../controllers");
const { adminAuth } = require("../middlewares/auth/auth.middleware");

const {
  cacheRoute,
  clearRouteCache,
} = require("../middlewares/cache/cache.middleware");
const { upload } = require("../middlewares/uploadMiddleware");

/**
 * @swagger
 * /festivals:
 *   post:
 *     summary: Create a new festival
 *     tags: [Festivals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the festival
 *               description:
 *                 type: string
 *                 description: Description of the festival
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date of the festival
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date of the festival
 *               isActive:
 *                 type: boolean
 *                 description: Whether the festival is active
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Festival image
 *     responses:
 *       201:
 *         description: Festival created successfully
 *       400:
 *         description: Bad request
 */
router.post(
  "/",
  adminAuth,
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "cardImages", maxCount: 4 },
  ]),
  clearRouteCache("festivals_*"),
  festivalController.createFestival
);

/**
 * @swagger
 * /festivals:
 *   get:
 *     summary: Get all festivals with pagination and filters
 *     tags: [Festivals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name or description
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of festivals
 */
router.get(
  "/",
  adminAuth,
  cacheRoute("festivals_", 300),
  festivalController.getAllFestivals
);

/**
 * @swagger
 * /festivals/{id}:
 *   get:
 *     summary: Get a festival by ID
 *     tags: [Festivals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Festival ID
 *     responses:
 *       200:
 *         description: Festival details
 *       404:
 *         description: Festival not found
 */
router.get("/:id", adminAuth, festivalController.getFestivalById);

/**
 * @swagger
 * /festivals/{id}:
 *   put:
 *     summary: Update a festival
 *     tags: [Festivals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Festival ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               isActive:
 *                 type: boolean
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Festival updated successfully
 *       404:
 *         description: Festival not found
 */
router.put(
  "/:id",
  adminAuth,
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "cardImages", maxCount: 4 },
  ]),
  clearRouteCache("festivals_*"),
  festivalController.updateFestivalById
);

/**
 * @swagger
 * /festivals/{id}:
 *   delete:
 *     summary: Delete a festival
 *     tags: [Festivals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Festival ID
 *     responses:
 *       200:
 *         description: Festival deleted successfully
 *       404:
 *         description: Festival not found
 */
router.delete(
  "/:id",
  adminAuth,
  clearRouteCache("festivals_*"),
  festivalController.deleteFestivalById
);
/**
 * @swagger
 * /festivals/{id}/toggle-status:
 *   patch:
 *     summary: Toggle festival active status
 *     tags: [Festivals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Festival ID
 *     responses:
 *       200:
 *         description: Festival status toggled successfully
 *       404:
 *         description: Festival not found
 */
router.patch(
  "/:id/toggle-status",
  adminAuth,
  clearRouteCache("festivals_*"),
  festivalController.toggleFestivalStatus
);

/**
 * @swagger
 * /festivals/{id}/products:
 *   get:
 *     summary: Get products list for a festival
 *     tags: [Festivals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Festival ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 */
router.get(
  "/:id/products",
  adminAuth,
  festivalController.getProductsByFestival
);
module.exports = router;
