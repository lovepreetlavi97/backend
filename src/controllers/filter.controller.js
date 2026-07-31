const { Product } = require("../models/index");
const { successResponse, errorResponse } = require("../utils/responseUtil");
const { isValidId } = require("../utils/idUtils");

const getColors = async (req, res) => {
  try {
    return successResponse(res, 200, "Colors retrieved", ["Gold", "Silver", "Rose Gold"]);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const getMaterials = async (req, res) => {
  try {
    return successResponse(res, 200, "Materials retrieved", ["22K Gold", "18K Gold", "925 Silver"]);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const getPurity = async (req, res) => {
  try {
    return successResponse(res, 200, "Purity retrieved", ["22K", "18K", "14K", "925"]);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const getFilterCounts = async (req, res) => {
  try {
    const result = {
      colors: [{ label: "Gold", count: 10 }, { label: "Silver", count: 5 }],
      materials: [{ label: "22K Gold", count: 8 }],
      purities: [{ label: "22K", count: 8 }]
    };

    return successResponse(res, 200, "Filter counts retrieved", result);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const getFilters = async (req, res) => {
  try {
    const priceRanges = [
      { label: "Under 1500", min: 0, max: 1500 },
      { label: "1500–3000", min: 1500, max: 3000 },
      { label: "3000–5000", min: 3000, max: 5000 },
      { label: "Above 5000", min: 5000, max: 1000000 }
    ];

    return successResponse(res, 200, "Filters retrieved", {
      colors: ["Gold", "Silver", "Rose Gold"],
      materials: ["22K Gold", "18K Gold", "925 Silver"],
      purities: ["22K", "18K", "14K"],
      styles: ["Traditional", "Modern", "Minimalist"],
      priceRanges
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = { getColors, getMaterials, getPurity, getFilterCounts, getFilters };
