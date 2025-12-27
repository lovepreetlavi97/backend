const express = require("express");
const router = express.Router();

const instagramVideoController = require("../controllers/instagramVideo.controller");
const { userAuth } = require("../middlewares/auth/auth.middleware");
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
 *               - image
 *               - instagramLink
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: MP4 video file
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
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
router.post(
  "/",

  uploadInstagramVideo,
  instagramVideoController.createVideo
);

/**
 * @swagger
 * /instagram-videos:
 *   get:
 *     summary: Get all active Instagram videos (Public / Homepage)
 *     tags: [Instagram Videos]
 *     responses:
 *       200:
 *         description: Instagram videos fetched successfully
 *       500:
 *         description: Internal server error
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
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional new MP4 video file
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
 *     responses:
 *       200:
 *         description: Instagram video updated successfully
 *       404:
 *         description: Video not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  
  uploadInstagramVideo,
  instagramVideoController.updateVideo
);

/**
 * @swagger
 * /instagram-videos/{id}:
 *   delete:
 *     summary: Delete Instagram video (Admin)
 *     tags: [Instagram Videos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Instagram video deleted successfully
 *       404:
 *         description: Video not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/:id",

  instagramVideoController.deleteVideo
);

module.exports = router;
