const express = require('express');
const router = express.Router();
const festivalController = require('../controllers/festival.controller');

/**
 * @swagger
 * tags:
 *   name: Festival
 *   description: Festival management
 */

/**
 * @swagger
 * /festivals:
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
router.post('/', festivalController.createFestival);

/**
 * @swagger
 * /festivals:
 *   get:
 *     summary: Get all festivals
 *     tags: [Festival]
 *     responses:
 *       200:
 *         description: A list of festivals
 */
router.get('/', festivalController.getAllFestivals);

/**
 * @swagger
 * /festivals/{id}:
 *   get:
 *     summary: Get a festival by ID
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
router.get('/:id', festivalController.getFestivalById);

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
router.put('/:id', festivalController.updateFestivalById);

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
router.delete('/:id', festivalController.deleteFestivalById);

module.exports = router;
