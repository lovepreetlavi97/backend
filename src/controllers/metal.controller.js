const { Metal } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseUtil');

exports.createMetal = async (req, res) => {
  try {
    console.log('Creating metal with body:', typeof req.body, req.body);
    const metal = await Metal.create(req.body);
    return successResponse(res, 201, 'Metal created successfully', { metal });
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Error creating metal');
  }
};

exports.getAllMetals = async (req, res) => {
  try {
    const metals = await Metal.find();
    return successResponse(res, 200, 'Metals retrieved successfully', { metals });
  } catch (error) {
    console.error('Error in getAllMetals:', error);
    return errorResponse(res, 500, error.message || 'Error retrieving metals');
  }
};

exports.getMetal = async (req, res) => {
  try {
    const metal = await Metal.findById(req.params.id);
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
    const metal = await Metal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!metal) {
      return errorResponse(res, 404, 'Metal not found');
    }
    return successResponse(res, 200, 'Metal updated successfully', { metal });
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Error updating metal');
  }
};

exports.deleteMetal = async (req, res) => {
  try {
    const metal = await Metal.findByIdAndDelete(req.params.id);
    if (!metal) {
      return errorResponse(res, 404, 'Metal not found');
    }
    return successResponse(res, 200, 'Metal deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Error deleting metal');
  }
};
