const express = require('express');
const router = express.Router();
const filterController = require('../controllers/filter.controller');
const { cacheRoute } = require("../middlewares/cache/cache.middleware");

/**
 * @swagger
 * tags:
 *   name: Filters
 *   description: Dynamic product filters
 */

router.get('/colors', cacheRoute(300), filterController.getColors);
router.get('/materials', cacheRoute(300), filterController.getMaterials);
router.get('/purity', cacheRoute(300), filterController.getPurity);
router.get('/counts', cacheRoute(300), filterController.getFilterCounts);
router.get('/', cacheRoute(300), filterController.getFilters);

module.exports = router;
