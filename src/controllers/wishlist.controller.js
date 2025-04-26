const { 
  create, 
  findOne, 
  findMany,
  findAndUpdate 
} = require('../services/mongodb/mongoService');

const { Wishlist, Product } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");
const mongoose = require('mongoose');

// Add to Wishlist
const addToWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;
    
    // Validate product ID
    if (!productId) {
      return errorResponse(res, 400, "Product ID is required");
    }
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return errorResponse(res, 400, "Invalid product ID format");
    }
    
    // Check if product exists and is available
    const productExists = await Product.exists({ 
      _id: productId,
      isDeleted: false,
      isBlocked: false 
    });
    
    if (!productExists) {
      return errorResponse(res, 404, "Product not found or unavailable");
    }

    let wishlist = await findOne(Wishlist, { userId });

    if (!wishlist) {
      // Create new wishlist if it doesn't exist
      wishlist = await create(Wishlist, { userId, products: [productId] });
    } else if (!wishlist.products.includes(productId)) {
      // Add product if not already in wishlist
      wishlist.products.push(productId);
      await wishlist.save();
    } else {
      // Product already in wishlist
      return successResponse(res, 200, "Product is already in your wishlist", { 
        wishlistId: wishlist._id,
        productCount: wishlist.products.length 
      });
    }

    // Clear wishlist cache
    await cacheUtils.del(`wishlist_${userId}`);
    await cacheUtils.del(`navbar_counts_${userId}`);
    
    return successResponse(res, 200, messages.ADDED_PRODUCT_WISHLIST, { 
      wishlistId: wishlist._id,
      productCount: wishlist.products.length 
    });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    return errorResponse(res, 500, error.message || "Failed to add product to wishlist");
  }
};

// Remove from Wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;
    
    // Validate product ID
    if (!productId) {
      return errorResponse(res, 400, "Product ID is required");
    }
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return errorResponse(res, 400, "Invalid product ID format");
    }

    const wishlist = await findAndUpdate(
      Wishlist,
      { userId },
      { $pull: { products: productId } },
      { new: true }
    );

    if (!wishlist) {
      return errorResponse(res, 404, messages.WISHLIST_NOT_FOUND);
    }

    // Clear wishlist cache
    await cacheUtils.del(`wishlist_${userId}`);
    await cacheUtils.del(`navbar_counts_${userId}`);
    
    return successResponse(res, 200, messages.REMOVED_PRODUCT_WISHLIST, { 
      wishlistId: wishlist._id,
      productCount: wishlist.products.length 
    });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    return errorResponse(res, 500, error.message || "Failed to remove product from wishlist");
  }
};

// Get Wishlist
const getWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Try to get from cache first
    const cacheKey = `wishlist_${userId}`;
    const cachedWishlist = await cacheUtils.get(cacheKey);
    
    if (cachedWishlist) {
      return successResponse(res, 200, messages.WISHLIST_RETRIEVED, {
        wishlist: cachedWishlist
      });
    }
    
    // Get wishlist with populated product details
    const wishlist = await Wishlist.findOne({ userId })
      .populate({
        path: "products",
        select: "name slug actualPrice discountedPrice weight images isInStock stock",
        match: { isDeleted: false, isBlocked: false }
      })
      .lean();
    
    if (!wishlist) {
      // Create empty wishlist for the user
      const newWishlist = await create(Wishlist, { userId, products: [] });
      return successResponse(res, 200, "Empty wishlist created", {
        wishlist: {
          _id: newWishlist._id,
          userId,
          products: [],
          createdAt: newWishlist.createdAt,
          updatedAt: newWishlist.updatedAt
        }
      });
    }
    
    // Filter out any null products (may happen if products were deleted/blocked after being added to wishlist)
    wishlist.products = wishlist.products.filter(product => product !== null);
    
    // Cache the wishlist data
    await cacheUtils.set(cacheKey, wishlist, 600); // Cache for 10 minutes
    
    return successResponse(res, 200, messages.WISHLIST_RETRIEVED, { wishlist });
  } catch (error) {
    console.error("Get wishlist error:", error);
    return errorResponse(res, 500, error.message || "Failed to retrieve wishlist");
  }
};

// Clear Wishlist
const clearWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const wishlist = await Wishlist.findOneAndUpdate(
      { userId },
      { $set: { products: [] } },
      { new: true }
    );
    
    if (!wishlist) {
      return errorResponse(res, 404, messages.WISHLIST_NOT_FOUND);
    }
    
    // Clear wishlist cache
    await cacheUtils.del(`wishlist_${userId}`);
    await cacheUtils.del(`navbar_counts_${userId}`);
    
    return successResponse(res, 200, "Wishlist cleared successfully", { wishlist });
  } catch (error) {
    console.error("Clear wishlist error:", error);
    return errorResponse(res, 500, error.message || "Failed to clear wishlist");
  }
};

// Check if product is in wishlist
const isProductInWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;
    
    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return errorResponse(res, 400, "Invalid product ID format");
    }
    
    const wishlist = await Wishlist.findOne({
      userId,
      products: { $in: [productId] }
    });
    
    return successResponse(res, 200, "Wishlist status retrieved", {
      inWishlist: !!wishlist
    });
  } catch (error) {
    console.error("Check wishlist product error:", error);
    return errorResponse(res, 500, error.message || "Failed to check wishlist status");
  }
};

// Export the functions
module.exports = {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  clearWishlist,
  isProductInWishlist
};
