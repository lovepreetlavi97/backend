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

const getFilters = async (req, res) => {
  try {
    const { subcategoryId, gender } = req.query;
    const query = { isDeleted: false, isBlocked: false };

    if (subcategoryId && mongoose.Types.ObjectId.isValid(subcategoryId)) {
      query.subcategoryId = new mongoose.Types.ObjectId(subcategoryId);
    }
    if (gender) {
      query['attributes.gender'] = gender;
    }

    const [colors, materials, purities, styles] = await Promise.all([
      Product.distinct("attributes.color", { ...query, "attributes.color": { $ne: null, $ne: "" } }),
      Product.distinct("attributes.material", { ...query, "attributes.material": { $ne: null, $ne: "" } }),
      Product.distinct("attributes.purity", { ...query, "attributes.purity": { $ne: null, $ne: "" } }),
      Product.distinct("attributes.style", { ...query, "attributes.style": { $ne: null, $ne: "" } })
    ]);

    // Static Price Ranges according to GIVA style
    const priceRanges = [
      { label: "Under 1500", min: 0, max: 1500 },
      { label: "1500–3000", min: 1500, max: 3000 },
      { label: "3000–5000", min: 3000, max: 5000 },
      { label: "Above 5000", min: 5000, max: 1000000 }
    ];

    return successResponse(res, 200, "Filters retrieved", {
      colors: colors.filter(Boolean),
      materials: materials.filter(Boolean),
      purities: purities.filter(Boolean),
      styles: styles.filter(Boolean),
      priceRanges
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = { getColors, getMaterials, getPurity, getFilterCounts, getFilters };
