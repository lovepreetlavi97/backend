const express = require("express");
const router = express.Router();
const instagramVideoController = require("../controllers/instagramVideo.controller");
const { adminOrSuperAdminAuth } = require("../middlewares/auth/auth.middleware");
const { uploadInstagramVideo } = require("../middlewares/instagramUpload");

/**
 * @swagger
 * tags:
 *   name: Instagram Videos
 *   description: Manage brand Instagram videos (admin upload & homepage feed)
 */

/**
 * @swagger
 * /instagram-videos:
 *   post:
 *     summary: Upload a brand Instagram video (Admin)
 *     tags: [Instagram Videos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - instagramLink
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: MP4 video file
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: Optional thumbnail Image
 *               instagramLink:
 *                 type: string
 *                 example: https://www.instagram.com/reel/ABC123/
 *               caption:
 *                 type: string
 *                 example: Rose gold necklace ✨
 *               sortOrder:
 *                 type: number
 *                 example: 1
 *     responses:
 *       201:
 *         description: Instagram video uploaded successfully
 */
router.post(
  "/",
  adminOrSuperAdminAuth,
  uploadInstagramVideo,
  instagramVideoController.createVideo
);

/**
 * @swagger
 * /instagram-videos:
 *   get:
 *     summary: Get Instagram videos (Public / Admin)
 *     tags: [Instagram Videos]
 *     parameters:
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *         description: If true, returns all videos including inactive ones (Admin)
 *     responses:
 *       200:
 *         description: Instagram videos fetched successfully
 */
router.get("/", instagramVideoController.getAllVideos);

/**
 * @swagger
 * /instagram-videos/{id}:
 *   put:
 *     summary: Update Instagram video details (Admin)
 *     tags: [Instagram Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *               instagramLink:
 *                 type: string
 *                 example: https://www.instagram.com/reel/XYZ789/
 *               caption:
 *                 type: string
 *                 example: Updated caption text
 *               sortOrder:
 *                 type: number
 *                 example: 2
 *               isActive:
 *                 type: boolean
 *                 example: true
 */
router.put(
  "/:id",
  adminOrSuperAdminAuth,
  uploadInstagramVideo,
  instagramVideoController.updateVideo
);

/**
 * @swagger
 * /instagram-videos/{id}:
 *   delete:
 *     summary: Delete Instagram video (Admin)
 */
router.delete(
  "/:id",
  adminOrSuperAdminAuth,
  instagramVideoController.deleteVideo
);

module.exports = router;
