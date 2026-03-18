const express = require("express");
const router = express.Router();
const siteSettingsController = require("../controllers/siteSettings.controller");
const { adminOrSuperAdminAuth } = require("../middlewares/auth/auth.middleware");
const { clearRouteCache } = require("../middlewares/cache/cache.middleware");

router.get("/", adminOrSuperAdminAuth, siteSettingsController.getAdminSettings);
router.put(
  "/",
  adminOrSuperAdminAuth,
  clearRouteCache("route_/api/v1/settings*"),
  siteSettingsController.updateAdminSettings,
);

module.exports = router;

