const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/banner.controller');
const { uploadSingleImage } = require("../middlewares/multerUploads");
const { adminAuth } = require('../middlewares/auth/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Banners
 *   description: Banner management
 */

/**
 * @swagger
 * /banners:
 *   post:
 *     summary: Create a new banner
 *     tags: [Banners]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the banner.
 *                 example: "Summer Collection"
 *               description:
 *                 type: string
 *                 description: Description of the banner.
 *                 example: "Discover our latest summer jewelry collection"
 *               type:
 *                 type: string
 *                 description: Type of banner (home, category, popup, slider).
 *                 enum: [home, category, popup, slider]
 *                 default: home
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Banner image file.
 *               link:
 *                 type: string
 *                 description: URL link for the banner.
 *                 example: "/collections/summer"
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date for banner display.
 *                 example: "2024-03-15"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date for banner display.
 *                 example: "2024-06-15"
 *               status:
 *                 type: string
 *                 description: Banner status.
 *                 enum: [active, inactive, scheduled]
 *                 default: active
 *               position:
 *                 type: integer
 *                 description: Display position (order) of the banner.
 *                 example: 1
 *     responses:
 *       201:
 *         description: Banner created successfully
 *       400:
 *         description: Bad request
 */
router.post('/', adminAuth, uploadSingleImage, bannerController.createBanner);

/**
 * @swagger
 * /banners:
 *   get:
 *     summary: Get all banners with pagination and filters
 *     tags: [Banners]
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
 *         description: Search term for title or description
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [home, category, popup, slider]
 *         description: Filter by banner type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, scheduled]
 *         description: Filter by banner status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: position
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: A list of banners with pagination info
 */
router.get('/', adminAuth, bannerController.getAllBanners);

/**
 * @swagger
 * /banners/{id}:
 *   get:
 *     summary: Get a banner by ID
 *     tags: [Banners]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the banner
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Banner details
 *       404:
 *         description: Banner not found
 */
router.get('/:id', adminAuth, bannerController.getBannerById);

/**
 * @swagger
 * /banners/{id}:
 *   put:
 *     summary: Update a banner by ID
 *     tags: [Banners]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the banner
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The updated title of the banner.
 *               description:
 *                 type: string
 *                 description: Updated description of the banner.
 *               type:
 *                 type: string
 *                 description: Type of banner.
 *                 enum: [home, category, popup, slider]
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Banner image file.
 *               link:
 *                 type: string
 *                 description: URL link for the banner.
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date for banner display.
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date for banner display.
 *               status:
 *                 type: string
 *                 description: Banner status.
 *                 enum: [active, inactive, scheduled]
 *               position:
 *                 type: integer
 *                 description: Display position (order) of the banner.
 *     responses:
 *       200:
 *         description: Banner updated successfully
 *       404:
 *         description: Banner not found
 */
router.put('/:id', adminAuth, uploadSingleImage, bannerController.updateBannerById);

/**
 * @swagger
 * /banners/{id}:
 *   delete:
 *     summary: Delete a banner by ID (soft delete)
 *     tags: [Banners]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the banner
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Banner deleted successfully
 *       404:
 *         description: Banner not found
 */
router.delete('/:id', adminAuth, bannerController.deleteBannerById);

/**
 * @swagger
 * /banners/{id}/toggle-status:
 *   patch:
 *     summary: Toggle the status of a banner (active/inactive)
 *     tags: [Banners]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the banner
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Banner status toggled successfully
 *       404:
 *         description: Banner not found
 */
router.patch('/:id/toggle-status', adminAuth, bannerController.toggleBannerStatus);

/**
 * @swagger
 * /banners/{id}/position:
 *   patch:
 *     summary: Update the position of a banner (move up or down)
 *     tags: [Banners]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the banner
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               direction:
 *                 type: string
 *                 enum: [up, down]
 *                 description: Direction to move the banner
 *                 example: "up"
 *     responses:
 *       200:
 *         description: Banner position updated successfully
 *       400:
 *         description: Invalid direction or cannot move further
 *       404:
 *         description: Banner not found
 */
router.patch('/:id/position', adminAuth, bannerController.updateBannerPosition);

module.exports = router;
