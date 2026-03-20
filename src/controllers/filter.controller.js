const { Product } = require("../models/index");
const { successResponse, errorResponse } = require("../utils/responseUtil");
const mongoose = require('mongoose');

const getColors = async (req, res) => {
  try {
    const colors = await Product.distinct("attributes.color", { isDeleted: false, "attributes.color": { $ne: null, $ne: "" } });
    return successResponse(res, 200, "Colors retrieved", colors.filter(Boolean));
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const getMaterials = async (req, res) => {
  try {
    const { color } = req.query;
    const query = { isDeleted: false, "attributes.material": { $ne: null, $ne: "" } };
    if (color) query["attributes.color"] = color;
    
    const materials = await Product.distinct("attributes.material", query);
    return successResponse(res, 200, "Materials retrieved", materials.filter(Boolean));
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const getPurity = async (req, res) => {
  try {
    const { color, material } = req.query;
    const query = { isDeleted: false, "attributes.purity": { $ne: null, $ne: "" } };
    if (color) query["attributes.color"] = color;
    if (material) query["attributes.material"] = material;

    const purities = await Product.distinct("attributes.purity", query);
    return successResponse(res, 200, "Purity retrieved", purities.filter(Boolean));
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const getFilterCounts = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.query;
    const match = { isDeleted: false };
    if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
      match.categoryId = new mongoose.Types.ObjectId(categoryId);
    }
    if (subcategoryId && mongoose.Types.ObjectId.isValid(subcategoryId)) {
      match.subcategoryId = new mongoose.Types.ObjectId(subcategoryId);
    }

    const counts = await Product.aggregate([
      { $match: match },
      {
        $facet: {
          colors: [
            { $match: { "attributes.color": { $exists: true, $ne: null, $ne: "" } } },
            { $group: { _id: "$attributes.color", count: { $sum: 1 } } }
          ],
          materials: [
            { $match: { "attributes.material": { $exists: true, $ne: null, $ne: "" } } },
            { $group: { _id: "$attributes.material", count: { $sum: 1 } } }
          ],
          purities: [
            { $match: { "attributes.purity": { $exists: true, $ne: null, $ne: "" } } },
            { $group: { _id: "$attributes.purity", count: { $sum: 1 } } }
          ]
        }
      }
    ]);

    // Format output
    const formatCounts = (arr) => arr.map(item => ({ label: item._id, count: item.count })).filter(item => item.label);
    
    const result = counts.length > 0 ? {
      colors: formatCounts(counts[0].colors),
      materials: formatCounts(counts[0].materials),
      purities: formatCounts(counts[0].purities)
    } : { colors: [], materials: [], purities: [] };

    return successResponse(res, 200, "Filter counts retrieved", result);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = { getColors, getMaterials, getPurity, getFilterCounts };
