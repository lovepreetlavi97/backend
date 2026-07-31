const { 
  Product, 
  Category, 
  Banner, 
  Festival, 
  CuratedCollection 
} = require('../models');
const { successResponse, errorResponse } = require('../utils/responseUtil');
const { cacheUtils } = require('../config/redis');
const { isValidId } = require('../utils/idUtils');

exports.getHomepageData = async (req, res) => {
  try {
    const { metalId } = req.query;
    
    const cacheKey = `homepage_data_${metalId || 'all'}`;
    const cachedData = await cacheUtils.get(cacheKey);
    
    if (cachedData) {
      return successResponse(res, 200, 'Homepage data retrieved from cache', cachedData);
    }

    const where = {};
    if (metalId && isValidId(metalId)) {
      where.categoryId = metalId;
    }

    const [
      featuredProducts,
      trendingProducts,
      categories,
      banners,
      festivals,
      curatedCollections
    ] = await Promise.all([
      Product.findAll({ where: { ...where, isFeatured: true }, limit: 8 }),
      Product.findAll({ where: { ...where, tags: 'Bestseller' }, limit: 8 }),
      Category.findAll({ where: { isActive: true }, limit: 12 }),
      Banner.findAll({ where: { isActive: true }, order: [['order', 'ASC']] }),
      Festival.findAll({ where: { isActive: true } }),
      CuratedCollection.findAll({ where: { isActive: true } })
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
    return errorResponse(res, 500, error.message || 'Error retrieving homepage data');
  }
};
