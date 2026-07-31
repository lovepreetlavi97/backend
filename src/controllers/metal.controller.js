const { Metal, Banner, Product } = require('../models');
const { create, findOne, findMany, findAndUpdate, deleteOne, countDocuments } = require('../services/mysql/mysqlService');
const { successResponse, errorResponse } = require('../utils/responseUtil');

exports.createMetal = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.position) {
      const highestMetal = await findOne(Metal, {}, {}, { sort: { position: -1 } });
      payload.position = highestMetal ? (highestMetal.position || 0) + 1 : 1;
    }
    
    const metal = await create(Metal, payload);
    return successResponse(res, 201, 'Metal created successfully', { metal });
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Error creating metal');
  }
};

exports.getAllMetals = async (req, res) => {
  try {
    const metals = await findMany(Metal, {}, null, { sort: { position: 1 } });
    return successResponse(res, 200, 'Metals retrieved successfully', { metals });
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Error retrieving metals');
  }
};

exports.getMetal = async (req, res) => {
  try {
    const metal = await findOne(Metal, { id: req.params.id });
    if (!metal) {
      return errorResponse(res, 404, 'Metal not found');
    }
    return successResponse(res, 200, 'Metal retrieved successfully', { metal });
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Error retrieving metal');
  }
};

exports.updateMetal = async (req, res) => {
  try {
    const metal = await findAndUpdate(Metal, { id: req.params.id }, req.body);
    if (!metal) {
      return errorResponse(res, 404, 'Metal not found');
    }
    return successResponse(res, 200, 'Metal updated successfully', { metal });
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Error updating metal');
  }
};

exports.updateMetalPosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body;

    if (!direction || !['up', 'down'].includes(direction)) {
      return errorResponse(res, 400, "Invalid direction. Must be 'up' or 'down'");
    }

    const currentMetal = await findOne(Metal, { id });
    if (!currentMetal) return errorResponse(res, 404, "Metal not found");

    const positionQuery = direction === 'up' 
      ? { position: { $lt: currentMetal.position } }
      : { position: { $gt: currentMetal.position } };

    const sortDirection = direction === 'up' ? -1 : 1;
    const adjacentMetal = await findOne(Metal, positionQuery, {}, { sort: { position: sortDirection } });

    if (!adjacentMetal) {
      return errorResponse(res, 400, `Cannot move metal ${direction}. It's already at the ${direction === 'up' ? 'first' : 'last'} priority.`);
    }

    // Swap positions
    const tempPosition = currentMetal.position;
    await findAndUpdate(Metal, { id: currentMetal.id }, { position: adjacentMetal.position });
    await findAndUpdate(Metal, { id: adjacentMetal.id }, { position: tempPosition });

    return successResponse(res, 200, "Metal position updated successfully");
  } catch (error) {
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

exports.deleteMetal = async (req, res) => {
  try {
    const metal = await findOne(Metal, { id: req.params.id });
    if (!metal) {
      return errorResponse(res, 404, 'Metal not found');
    }

    // Dependency check: check if any active products are using this metal
    const productInUse = await countDocuments(Product, { metalId: req.params.id, isDeleted: false });
    if (productInUse > 0) {
      return errorResponse(res, 400, "Cannot delete metal. It is currently being used by one or more active products.");
    }

    // Dependency check: check if any active banners are using this metal
    const bannerInUse = await countDocuments(Banner, { metalId: req.params.id, isDeleted: false });
    if (bannerInUse > 0) {
      return errorResponse(res, 400, "Cannot delete metal. It is currently being used by one or more active banners.");
    }

    await deleteOne(Metal, { id: req.params.id });
    return successResponse(res, 200, 'Metal deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Error deleting metal');
  }
};
