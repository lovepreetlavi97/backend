const { 
  Product, 
  Category, 
  Banner, 
  Festival, 
  CuratedCollection 
} = require('../models');
const { successResponse, errorResponse } = require('../utils/responseUtil');
const { cacheUtils } = require('../config/redis');
const mongoose = require('mongoose');

exports.getHomepageData = async (req, res) => {
  try {
    const { metalId } = req.query;
    
    const cacheKey = `homepage_data_${metalId || 'all'}`;
    const cachedData = await cacheUtils.get(cacheKey);
    
    if (cachedData) {
      return successResponse(res, 200, 'Homepage data retrieved from cache', cachedData);
    }

    const query = { isDeleted: false, isBlocked: false };
    if (metalId && mongoose.Types.ObjectId.isValid(metalId)) {
      query.metalIds = { $in: [new mongoose.Types.ObjectId(metalId)] };
    }

    const [
      featuredProducts,
      trendingProducts,
      categories,
      banners,
      festivals,
      curatedCollections
    ] = await Promise.all([
      Product.find({ ...query, isFeatured: true }).limit(8).lean(),
      Product.find({ ...query, tags: 'Bestseller' }).limit(8).lean(),
      Category.find(query).limit(12).lean(),
      Banner.find({ ...query, status: 'active' }).sort({ position: 1 }).lean(),
      Festival.find({ ...query, isActive: true }).lean(),
      CuratedCollection.find({ ...query, isActive: true }).sort({ position: 1 }).lean()
    ]);

    const homepageData = {
      featuredProducts,
      trendingProducts,
      categories,
      banners,
      festivals,
      curatedCollections
    };

    await cacheUtils.set(cacheKey, homepageData, 600);

    return successResponse(res, 200, 'Homepage data retrieved successfully', homepageData);
  } catch (error) {
    console.error("Homepage Data Error: ", error);
    return errorResponse(res, 500, error.message || 'Error retrieving homepage data');
  }
};
