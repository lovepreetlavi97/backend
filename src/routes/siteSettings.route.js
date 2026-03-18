const express = require("express");
const router = express.Router();
const siteSettingsController = require("../controllers/siteSettings.controller");

// Public endpoint for website
router.get("/public", siteSettingsController.getPublicSettings);

module.exports = router;

