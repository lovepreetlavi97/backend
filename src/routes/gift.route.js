const express = require("express");
const router = express.Router();
const giftController = require("../controllers/gift.controller");
const { adminOrSuperAdminAuth } = require("../middlewares/auth/auth.middleware");

/**
 * @route GET /api/v1/user/gift/filters
 * @desc Get available gift filters (occasions, themes, recipients, price ranges)
 * @access Public
 */
router.get("/filters", giftController.getGiftFilters);

/**
 * --- Admin Routes ---
 */

router.post("/", adminOrSuperAdminAuth, giftController.createGift);
router.get("/all", adminOrSuperAdminAuth, giftController.getAllGifts);
router.put("/:id", adminOrSuperAdminAuth, giftController.updateGift);
router.delete("/:id", adminOrSuperAdminAuth, giftController.deleteGift);

module.exports = router;
