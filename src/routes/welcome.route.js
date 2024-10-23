const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome route
 *     description: Returns a welcome message for the Suno API
 *     responses:
 *       200:
 *         description: Successful response
 *       500:
 *         description: Server error
 */
router.get('/', (req, res) => {
  res.send('Welcome to the Suno API!');
});

module.exports = router;
