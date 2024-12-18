const express = require('express');
const router = express.Router();
const festivalController = require('../controllers/festival.controller');
const { adminAuth, userAuth } = require('../middlewares/auth/auth.middleware');

/**
 * User-facing routes (no authentication required)
 */
const userRouter = express.Router();

/**
 * @swagger
 * /user/festivals:
 *   get:
 *     summary: Get all festivals (user-facing)
 *     tags: [Festival]
 *     responses:
 *       200:
 *         description: A list of festivals
 */
userRouter.get('/', festivalController.getAllFestivals);

/**
 * @swagger
 * /user/festivals/{id}:
 *   get:
 *     summary: Get a festival by ID (user-facing)
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
userRouter.get('/:id', festivalController.getFestivalById);


/**
 * Admin-facing routes (authentication required)
 */
const adminRouter = express.Router();

/**
 * @swagger
 * /admin/festivals:
 *   post:
 *     summary: Create a new festival
 *     tags: [Festival]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Festival created successfully
 *       400:
 *         description: Bad request
 */
adminRouter.post('/', adminAuth, festivalController.createFestival);

/**
 * @swagger
 * /admin/festivals:
 *   get:
 *     summary: Get all festivals (admin-facing)
 *     tags: [Festival]
 *     responses:
 *       200:
 *         description: A list of festivals for management
 */
adminRouter.get('/', adminAuth, festivalController.getAllFestivals);

/**
 * @swagger
 * /admin/festivals/{id}:
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
adminRouter.get('/:id', adminAuth, festivalController.getFestivalById);

/**
 * @swagger
 * /admin/festivals/{id}:
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Festival updated successfully
 *       404:
 *         description: Festival not found
 */
adminRouter.put('/:id', adminAuth, festivalController.updateFestivalById);

/**
 * @swagger
 * /admin/festivals/{id}:
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
adminRouter.delete('/:id', adminAuth, festivalController.deleteFestivalById);

/**
 * Mount user and admin routers
 */
router.use('/user/festivals', userRouter);
router.use('/admin/festivals', adminRouter);

module.exports = router;
