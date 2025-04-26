const express = require('express');
const router = express.Router();
const festivalController = require('../controllers/festival.controller');
const { adminAuth, userAuth } = require('../middlewares/auth/auth.middleware');
const { uploadMultipleImages } = require("../middlewares/multerUploads");





/**
 * @swagger
 * /festivals:
 *   post:
 *     summary: Create a new festival
 *     tags: [Festival]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the festival.
 *                 example: "Diwali"
 *               date:
 *                 type: string
 *                 format: date
 *                 description: The date of the festival.
 *                 example: "2025-11-12"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional array of image files. If not provided, a default image will be used.
 *     responses:
 *       201:
 *         description: Festival created successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.post('/', adminAuth, uploadMultipleImages, festivalController.createFestival);

/**
 * @swagger
 * /festivals:
 *   get:
 *     summary: Get all festivals (admin-facing)
 *     tags: [Festival]
 *     responses:
 *       200:
 *         description: A list of festivals for management
 */
router.get('/', adminAuth, festivalController.getAllFestivals);

/**
 * @swagger
 * /festivals/{id}:
 *   get:
 *     summary: Get a festival by ID (admin-facing)
 *     tags: [Festival]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the festival
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Festival details
 *       404:
 *         description: Festival not found
 */
router.get('/:id', adminAuth, festivalController.getFestivalById);



/**
 * @swagger
 * /festivals/{id}:
 *   put:
 *     summary: Update a festival by ID
 *     tags: [Festival]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the festival
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
 *                 description: The updated name of the festival.
 *                 example: "Holi"
 *               date:
 *                 type: string
 *                 format: date
 *                 description: The updated date of the festival.
 *                 example: "2025-03-21"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional updated array of image files. If not provided, the existing images will be retained.
 *     responses:
 *       200:
 *         description: Festival updated successfully
 *       404:
 *         description: Festival not found
 *       400:
 *         description: Bad request
 */
router.put('/:id', adminAuth,uploadMultipleImages, festivalController.updateFestivalById);


/**
 * @swagger
 * /festivals/{id}:
 *   delete:
 *     summary: Delete a festival by ID
 *     tags: [Festival]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the festival
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Festival deleted successfully
 *       404:
 *         description: Festival not found
 */
router.delete('/:id', adminAuth, festivalController.deleteFestivalById);



module.exports = router;
