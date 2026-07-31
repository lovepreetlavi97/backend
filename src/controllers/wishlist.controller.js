const { Wishlist, Product } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");
const { isValidId } = require("../utils/idUtils");

const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { productId } = req.body;
    
    if (!productId || !isValidId(productId)) {
      return errorResponse(res, 400, "Valid product ID is required");
    }
    
    const productExists = await Product.findByPk(productId);
    if (!productExists) {
      return errorResponse(res, 404, "Product not found");
    }

    let wishlist = await Wishlist.findOne({ where: { userId } });
    let productsList = wishlist && Array.isArray(wishlist.products) ? [...wishlist.products] : [];

    if (!wishlist) {
      wishlist = await Wishlist.create({ userId, products: [productId] });
    } else if (!productsList.includes(productId)) {
      productsList.push(productId);
      await wishlist.update({ products: productsList });
    }

    await cacheUtils.del(`wishlist_${userId}`);
    await cacheUtils.del(`navbar_counts_${userId}`);
    
    return successResponse(res, 200, messages.ADDED_PRODUCT_WISHLIST, { wishlist });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to add product to wishlist");
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { productId } = req.body;
    
    if (!productId || !isValidId(productId)) {
      return errorResponse(res, 400, "Valid product ID is required");
    }

    const wishlist = await Wishlist.findOne({ where: { userId } });
    if (!wishlist) {
      return errorResponse(res, 404, messages.WISHLIST_NOT_FOUND);
    }

    let productsList = Array.isArray(wishlist.products) ? wishlist.products.filter(id => String(id) !== String(productId)) : [];
    await wishlist.update({ products: productsList });

    await cacheUtils.del(`wishlist_${userId}`);
    await cacheUtils.del(`navbar_counts_${userId}`);
    
    return successResponse(res, 200, messages.REMOVED_PRODUCT_WISHLIST, { wishlist });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to remove product from wishlist");
  }
};

const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    const cacheKey = `wishlist_${userId}`;
    const cachedWishlist = await cacheUtils.get(cacheKey);
    if (cachedWishlist) {
      return successResponse(res, 200, messages.WISHLIST_RETRIEVED, { wishlist: cachedWishlist });
    }
    
    let wishlist = await Wishlist.findOne({ where: { userId } });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId, products: [] });
    }

    const productIds = Array.isArray(wishlist.products) ? wishlist.products : [];
    const products = productIds.length ? await Product.findAll({ where: { id: productIds } }) : [];

    const result = {
      id: wishlist.id,
      userId,
      products
    };

    await cacheUtils.set(cacheKey, result, 600);
    return successResponse(res, 200, messages.WISHLIST_RETRIEVED, { wishlist: result });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to retrieve wishlist");
  }
};

const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const wishlist = await Wishlist.findOne({ where: { userId } });
    
    if (!wishlist) {
      return errorResponse(res, 404, messages.WISHLIST_NOT_FOUND);
    }
    
    await wishlist.update({ products: [] });

    await cacheUtils.del(`wishlist_${userId}`);
    await cacheUtils.del(`navbar_counts_${userId}`);
    
    return successResponse(res, 200, "Wishlist cleared successfully", { wishlist });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to clear wishlist");
  }
};

const isProductInWishlist = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { productId } = req.params;
    
    if (!isValidId(productId)) {
      return errorResponse(res, 400, "Invalid product ID format");
    }
    
    const wishlist = await Wishlist.findOne({ where: { userId } });
    const inWishlist = wishlist && Array.isArray(wishlist.products) && wishlist.products.includes(productId);
    
    return successResponse(res, 200, "Wishlist status retrieved", { inWishlist: Boolean(inWishlist) });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to check wishlist status");
  }
};

const syncGuestWishlist = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { products } = req.body;

    if (!products || !Array.isArray(products)) {
      return errorResponse(res, 400, "Products array is required");
    }

    const validProducts = products.filter(p => isValidId(p));
    let wishlist = await Wishlist.findOne({ where: { userId } });

    if (!wishlist) {
      wishlist = await Wishlist.create({ userId, products: validProducts });
    } else {
      let existing = Array.isArray(wishlist.products) ? [...wishlist.products] : [];
      validProducts.forEach(p => {
        if (!existing.includes(p)) existing.push(p);
      });
      await wishlist.update({ products: existing });
    }

    await cacheUtils.del(`wishlist_${userId}`);
    await cacheUtils.del(`navbar_counts_${userId}`);

    return successResponse(res, 200, "Guest wishlist synced successfully", { wishlist });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to sync wishlist");
  }
};

module.exports = {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  clearWishlist,
  isProductInWishlist,
  syncGuestWishlist
};
