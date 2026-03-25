const express = require("express");
const router = express.Router();
const userProductController = require("../controllers/userProducts.controller");
// const { uploadImagesToBucket } = require('../middlewares/multerUploads');
const { cacheRoute } = require("../middlewares/cache/cache.middleware");

/**
 * @swagger
 * /user/products/{slug}:
 *   get:
 *     summary: Get product by slug
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get("/:slug", userProductController.getProductBySlug);

module.exports = router;
