const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { SiteSettings } = require("../models");

async function getOrCreateSettings() {
  let doc = await SiteSettings.findOne({ key: "main" });
  if (!doc) {
    doc = await SiteSettings.create({ key: "main" });
  }
  return doc;
}

// Public website settings
const getPublicSettings = async (_req, res) => {
  try {
    const doc = await getOrCreateSettings();

    // only expose safe public fields
    const data = {
      brand: doc.brand,
      contact: doc.contact,
      social: doc.social,
      links: doc.links,
      updatedAt: doc.updatedAt,
    };

    return successResponse(res, 200, messages.DATA_FETCHED, data);
  } catch (error) {
    console.error("Error fetching public site settings:", error);
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Admin: get full settings
const getAdminSettings = async (_req, res) => {
  try {
    const doc = await getOrCreateSettings();
    return successResponse(res, 200, messages.DATA_FETCHED, doc);
  } catch (error) {
    console.error("Error fetching admin site settings:", error);
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Admin: update settings (upsert singleton)
const updateAdminSettings = async (req, res) => {
  try {
    const payload = req.body || {};

    const doc = await SiteSettings.findOneAndUpdate(
      { key: "main" },
      { $set: payload },
      { new: true, upsert: true, runValidators: true },
    );

    return successResponse(res, 200, "Site settings updated", doc);
  } catch (error) {
    console.error("Error updating site settings:", error);
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

module.exports = {
  getPublicSettings,
  getAdminSettings,
  updateAdminSettings,
};

