const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { SiteSettings } = require("../models");
const { findOne, findAndUpdate, create } = require("../services/mysql/mysqlService");

async function getOrCreateSettings() {
  let doc = await findOne(SiteSettings, { key: "main" });
  if (!doc) {
    doc = await create(SiteSettings, { key: "main" });
  }
  return doc;
}

// Public website settings
const getPublicSettings = async (_req, res) => {
  try {
    const doc = await getOrCreateSettings();

    // exposed safe public fields
    const data = {
      brand: doc.brand,
      contact: doc.contact,
      social: doc.social,
      links: doc.links,
      featureBadges: doc.featureBadges || [],
      footerAbout: doc.footerAbout || "",
      updatedAt: doc.updatedAt,
    };

    return successResponse(res, 200, messages.DATA_FETCHED, data);
  } catch (error) {

    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Admin: get full settings
const getAdminSettings = async (_req, res) => {
  try {
    const doc = await getOrCreateSettings();
    return successResponse(res, 200, messages.DATA_FETCHED, doc);
  } catch (error) {

    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Admin: update settings (upsert singleton)
const updateAdminSettings = async (req, res) => {
  try {
    const payload = req.body || {};
    await getOrCreateSettings();

    const doc = await findAndUpdate(
      SiteSettings,
      { key: "main" },
      payload
    );

    return successResponse(res, 200, "Site settings updated", doc);
  } catch (error) {

    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

module.exports = {
  getPublicSettings,
  getAdminSettings,
  updateAdminSettings,
};
