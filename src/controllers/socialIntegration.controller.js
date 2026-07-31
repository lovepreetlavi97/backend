const { 
  create, 
  findOne, 
  findMany, 
  findAndUpdate, 
  deleteOne 
} = require('../services/mysql/mysqlService');

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

    return errorResponse(res, 500, error.message || "Failed to retrieve social integrations");
  }
};

// Get integration by ID
const getIntegrationById = async (req, res) => {
  try {
    const { id } = req.params;
    const integration = await findOne(SocialIntegration, { id, isDeleted: false });
    
    if (!integration) {
      return errorResponse(res, 404, "Social integration not found");
    }
    
    return successResponse(res, 200, "Social integration retrieved successfully", { integration });
  } catch (error) {

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
      { id, isDeleted: false },
      updateData
    );
    
    if (!integration) {
      return errorResponse(res, 404, "Social integration not found");
    }
    
    // Clear cache
    await cacheUtils.del('social_integrations');
    
    return successResponse(res, 200, "Social integration updated successfully", { integration });
  } catch (error) {

    return errorResponse(res, 500, error.message || "Failed to update social integration");
  }
};

// Toggle integration status
const toggleIntegration = async (req, res) => {
  try {
    const { id } = req.params;
    
    const integration = await findOne(SocialIntegration, { id, isDeleted: false });
    
    if (!integration) {
      return errorResponse(res, 404, "Social integration not found");
    }
    
    const updated = await findAndUpdate(
      SocialIntegration,
      { id },
      { enabled: !integration.enabled }
    );
    
    // Clear cache
    await cacheUtils.del('social_integrations');
    
    return successResponse(res, 200, "Social integration status updated successfully", { integration: updated });
  } catch (error) {

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
    
    const integration = await findOne(SocialIntegration, { id, isDeleted: false });
    
    if (!integration) {
      return errorResponse(res, 404, "Social integration not found");
    }
    
    const features = integration.features || {};
    features[feature] = enabled;
    
    const updated = await findAndUpdate(SocialIntegration, { id }, { features });
    
    // Clear cache
    await cacheUtils.del('social_integrations');
    
    return successResponse(res, 200, "Feature updated successfully", { integration: updated });
  } catch (error) {

    return errorResponse(res, 500, error.message || "Failed to update feature");
  }
};

// Delete integration
const deleteIntegration = async (req, res) => {
  try {
    const { id } = req.params;
    
    const integration = await findAndUpdate(
      SocialIntegration,
      { id, isDeleted: false },
      { isDeleted: true }
    );
    
    if (!integration) {
      return errorResponse(res, 404, "Social integration not found");
    }
    
    // Clear cache
    await cacheUtils.del('social_integrations');
    
    return successResponse(res, 200, "Social integration deleted successfully");
  } catch (error) {

    return errorResponse(res, 500, error.message || "Failed to delete social integration");
  }
};

// Sync integration stats
const syncIntegrationStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const integration = await findOne(SocialIntegration, { id, isDeleted: false });
    
    if (!integration) {
      return errorResponse(res, 404, "Social integration not found");
    }
    
    const stats = integration.stats || {};
    stats.lastSync = new Date();
    const updated = await findAndUpdate(SocialIntegration, { id }, { stats });
    
    // Clear cache
    await cacheUtils.del('social_integrations');
    
    return successResponse(res, 200, "Social integration stats synced successfully", { integration: updated });
  } catch (error) {

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