const { 
  create, 
  findOne, 
  findMany, 
  findAndUpdate, 
  deleteOne 
} = require('../services/mongodb/mongoService');

const { Relation } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");

// Create a new relation
const createRelation = async (req, res) => {
  try {
      const imageUrls = req.files.map((file) => file.location);
      const relationData = req.body;
      relationData.images = imageUrls;
      if (imageUrls.length === 0) {
        return errorResponse(res, 400, "One image is required");
      }
      const relation = await create(Relation, relationData);
      return successResponse(res, 201, messages.RELATION_CREATED, { relation });

  } catch (error) {
      return errorResponse(res, 400, error.message);
  }
};

// Get all relations
const getAllRelations = async (req, res) => {
  try {
      const relations = await findMany(Relation);

      if (!relations.length) {
          return errorResponse(res, 404, messages.RELATIONS_NOT_FOUND);
      }

      return successResponse(res, 200, messages.RELATIONS_RETRIEVED, { relations });

  } catch (error) {
      return errorResponse(res, 500, error.message);
  }
};

// Get a relation by ID
const getRelationById = async (req, res) => {
  try {
      const relation = await findOne(Relation, { _id: req.params.id });

      if (!relation) {
          return errorResponse(res, 404, messages.RELATION_NOT_FOUND);
      }

      return successResponse(res, 200, messages.RELATION_RETRIEVED, { relation });

  } catch (error) {
      return errorResponse(res, 500, error.message);
  }
};
// Update a relation by ID
const updateRelationById = async (req, res) => {
  try {
    // Safely handle image uploads
    const imageUrls = req.files?.map((file) => file.location) || [];
    const relationData = { ...req.body };

    // Only update imageUrls if new images are provided
    if (imageUrls.length === 0) {
      console.log("No new images provided, images will not be updated.");
      delete relationData.images; // Prevent updating images if none provided
    } else {
      relationData.images = imageUrls; // Update images if new ones exist
    }

    // Find and update the relation by ID
    const relation = await findAndUpdate(Relation, { _id: req.params.id }, relationData);

    if (!relation) {
      return errorResponse(res, 404, messages.RELATION_NOT_FOUND);
    }

    return successResponse(res, 200, messages.RELATION_UPDATED, { relation });

  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

// Delete a relation by ID
const deleteRelationById = async (req, res) => {
  try {
      const result = await deleteOne(Relation, { _id: req.params.id });

      if (result.deletedCount === 0) {
          return errorResponse(res, 404, messages.RELATION_NOT_FOUND);
      }

      return successResponse(res, 200, messages.RELATION_DELETED);

  } catch (error) {
      return errorResponse(res, 500, error.message);
  }
};

// Export the functions
module.exports = {
  createRelation,
  getAllRelations,
  getRelationById,
  updateRelationById,
  deleteRelationById,
};