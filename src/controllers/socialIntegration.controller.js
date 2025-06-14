const { 
  create, 
  findOne, 
  findMany, 
  findAndUpdate, 
  deleteOne 
} = require('../services/mongodb/mongoService');

const { SocialIntegration } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");

// Get all social integrations
const getAllIntegrations = async (req, res) => {
  try {
    const cacheKey = 'social_integrations';
    
    // Try to get from cache
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      return successResponse(res, 200, "Social integrations retrieved successfully", { integrations: cachedData });
    }

    const integrations = await findMany(SocialIntegration, { isDeleted: false });
    
    // Cache the result
    await cacheUtils.set(cacheKey, integrations, 300); // Cache for 5 minutes
    
    return successResponse(res, 200, "Social integrations retrieved successfully", { integrations });
  } catch (error) {
    console.error("Get all integrations error:", error);
    return errorResponse(res, 500, error.message || "Failed to retrieve social integrations");
  }
};

// Get integration by ID
const getIntegrationById = async (req, res) => {
  try {
    const { id } = req.params;
    const integration = await findOne(SocialIntegration, { _id: id, isDeleted: false });
    
    if (!integration) {
      return errorResponse(res, 404, "Social integration not found");
    }
    
    return successResponse(res, 200, "Social integration retrieved successfully", { integration });
  } catch (error) {
    console.error("Get integration error:", error);
    return errorResponse(res, 500, error.message || "Failed to retrieve social integration");
  }
};

// Create new integration
const createIntegration = async (req, res) => {
  try {
    const { platform, name, settings, features } = req.body;
    
    if (!platform || !name) {
      return errorResponse(res, 400, "Platform and name are required");
    }
    
    // Check if integration already exists for this platform
    const existingIntegration = await findOne(SocialIntegration, { 
      platform, 
      isDeleted: false 
    });
    
    if (existingIntegration) {
      return errorResponse(res, 409, `Integration for ${platform} already exists`);
    }
    
    const integration = await create(SocialIntegration, {
      platform,
      name,
      settings,
      features,
      enabled: true
    });
    
    // Clear cache
    await cacheUtils.del('social_integrations');
    
    return successResponse(res, 201, "Social integration created successfully", { integration });
  } catch (error) {
    console.error("Create integration error:", error);
    return errorResponse(res, 500, error.message || "Failed to create social integration");
  }
};

// Update integration
const updateIntegration = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const integration = await findAndUpdate(
      SocialIntegration,
      { _id: id, isDeleted: false },
      updateData
    );
    
    if (!integration) {
      return errorResponse(res, 404, "Social integration not found");
    }
    
    // Clear cache
    await cacheUtils.del('social_integrations');
    
    return successResponse(res, 200, "Social integration updated successfully", { integration });
  } catch (error) {
    console.error("Update integration error:", error);
    return errorResponse(res, 500, error.message || "Failed to update social integration");
  }
};

// Toggle integration status
const toggleIntegration = async (req, res) => {
  try {
    const { id } = req.params;
    
    const integration = await findOne(SocialIntegration, { _id: id, isDeleted: false });
    
    if (!integration) {
      return errorResponse(res, 404, "Social integration not found");
    }
    
    integration.enabled = !integration.enabled;
    await integration.save();
    
    // Clear cache
    await cacheUtils.del('social_integrations');
    
    return successResponse(res, 200, "Social integration status updated successfully", { integration });
  } catch (error) {
    console.error("Toggle integration error:", error);
    return errorResponse(res, 500, error.message || "Failed to toggle social integration");
  }
};

// Update feature settings
const updateFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const { feature, enabled } = req.body;
    
    if (!feature) {
      return errorResponse(res, 400, "Feature name is required");
    }
    
    const integration = await findOne(SocialIntegration, { _id: id, isDeleted: false });
    
    if (!integration) {
      return errorResponse(res, 404, "Social integration not found");
    }
    
    if (!integration.features.hasOwnProperty(feature)) {
      return errorResponse(res, 400, "Invalid feature name");
    }
    
    integration.features[feature] = enabled;
    await integration.save();
    
    // Clear cache
    await cacheUtils.del('social_integrations');
    
    return successResponse(res, 200, "Feature updated successfully", { integration });
  } catch (error) {
    console.error("Update feature error:", error);
    return errorResponse(res, 500, error.message || "Failed to update feature");
  }
};

// Delete integration
const deleteIntegration = async (req, res) => {
  try {
    const { id } = req.params;
    
    const integration = await findAndUpdate(
      SocialIntegration,
      { _id: id, isDeleted: false },
      { isDeleted: true }
    );
    
    if (!integration) {
      return errorResponse(res, 404, "Social integration not found");
    }
    
    // Clear cache
    await cacheUtils.del('social_integrations');
    
    return successResponse(res, 200, "Social integration deleted successfully");
  } catch (error) {
    console.error("Delete integration error:", error);
    return errorResponse(res, 500, error.message || "Failed to delete social integration");
  }
};

// Sync integration stats
const syncIntegrationStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const integration = await findOne(SocialIntegration, { _id: id, isDeleted: false });
    
    if (!integration) {
      return errorResponse(res, 404, "Social integration not found");
    }
    
    // Here you would typically make API calls to the respective social platforms
    // For now, we'll just update the lastSync timestamp
    integration.stats.lastSync = new Date();
    await integration.save();
    
    // Clear cache
    await cacheUtils.del('social_integrations');
    
    return successResponse(res, 200, "Social integration stats synced successfully", { integration });
  } catch (error) {
    console.error("Sync stats error:", error);
    return errorResponse(res, 500, error.message || "Failed to sync integration stats");
  }
};

module.exports = {
  getAllIntegrations,
  getIntegrationById,
  createIntegration,
  updateIntegration,
  toggleIntegration,
  updateFeature,
  deleteIntegration,
  syncIntegrationStats
}; 