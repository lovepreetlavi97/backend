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
        // Include fields required to compute pricing consistently with trending-products
        select: "name slug actualPrice discountedPrice discountPercent weight images isInStock stock image isPriceFixed makingCharges priceRuleId",
        populate: { path: "priceRuleId", select: "name price" },
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

    // Align pricing with trending-products (dynamic actualPrice + discountedPrice from discountPercent)
    if (wishlist.products && wishlist.products.length) {
      wishlist.products = wishlist.products.map((product) => {
        if (
          product &&
          product.isPriceFixed === false &&
          product.priceRuleId &&
          product.priceRuleId.price
        ) {
          const liveRate = product.priceRuleId.price;
          const weight = product.weight || 0;
          const makingCharges = product.makingCharges || 0;

          product.actualPrice = (liveRate * weight) + makingCharges;

          if (product.discountPercent && product.discountPercent > 0) {
            const discounted = product.actualPrice * (1 - (product.discountPercent / 100));
            product.discountedPrice = parseFloat(discounted.toFixed(2));
          }
        }

        // Keep a computed percentage for UI parity (optional)
        if (product?.actualPrice && product?.discountedPrice && product.actualPrice > 0) {
          product.discountPercentage = Math.round(
            ((product.actualPrice - product.discountedPrice) / product.actualPrice) * 100
          );
        } else if (product) {
          product.discountPercentage = 0;
        }

        return product;
      });
    }
    
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
// Sync guest wishlist with user wishlist
const syncGuestWishlist = async (req, res) => {
  try {
    console.log("syncGuestWishlist called", req.body);
    const userId = req.user._id;
    const { products } = req.body; // array of productIds or product objects

    if (!products || !Array.isArray(products)) {
      return errorResponse(res, 400, "Products array is required");
    }

    // Extract product IDs in case frontend sends objects instead of strings
    const productIds = products.map(p => (typeof p === "string" ? p : p._id));

    // Filter out invalid productIds
    const validProducts = productIds.filter(p => mongoose.Types.ObjectId.isValid(p));

    if (!validProducts.length) {
      return errorResponse(res, 400, "No valid product IDs found");
    }

    let wishlist = await findOne(Wishlist, { userId });

    if (!wishlist) {
      // Create new wishlist
      wishlist = await create(Wishlist, { userId, products: validProducts });
    } else {
      // Add only products that are not already in wishlist
      validProducts.forEach(p => {
        if (!wishlist.products.includes(p)) wishlist.products.push(p);
      });
      await wishlist.save();
    }

    // Populate product details
    const populatedWishlist = await Wishlist.findOne({ userId })
      .populate({
        path: "products",
        select: "name slug actualPrice discountedPrice discountPercent weight images isInStock stock image isPriceFixed makingCharges priceRuleId",
        populate: { path: "priceRuleId", select: "name price" },
        match: { isDeleted: false, isBlocked: false }
      })
      .lean();

    // Filter out null products
    populatedWishlist.products = populatedWishlist.products.filter(product => product !== null);

    // Align pricing with trending-products
    if (populatedWishlist.products && populatedWishlist.products.length) {
      populatedWishlist.products = populatedWishlist.products.map((product) => {
        if (
          product &&
          product.isPriceFixed === false &&
          product.priceRuleId &&
          product.priceRuleId.price
        ) {
          const liveRate = product.priceRuleId.price;
          const weight = product.weight || 0;
          const makingCharges = product.makingCharges || 0;

          product.actualPrice = (liveRate * weight) + makingCharges;
          if (product.discountPercent && product.discountPercent > 0) {
            const discounted = product.actualPrice * (1 - (product.discountPercent / 100));
            product.discountedPrice = parseFloat(discounted.toFixed(2));
          }
        }

        if (product?.actualPrice && product?.discountedPrice && product.actualPrice > 0) {
          product.discountPercentage = Math.round(
            ((product.actualPrice - product.discountedPrice) / product.actualPrice) * 100
          );
        } else if (product) {
          product.discountPercentage = 0;
        }

        return product;
      });
    }

    // Clear cache
    await cacheUtils.del(`wishlist_${userId}`);
    await cacheUtils.del(`navbar_counts_${userId}`);

    // Cache the updated wishlist
    await cacheUtils.set(`wishlist_${userId}`, populatedWishlist, 600); // 10 minutes

    return successResponse(res, 200, "Guest wishlist synced successfully", {
      wishlist: populatedWishlist
    });
  } catch (error) {
    console.error("Sync guest wishlist error:", error);
    return errorResponse(res, 500, error.message || "Failed to sync wishlist");
  }
};


// Export the functions
module.exports = {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  clearWishlist,
  isProductInWishlist,
  syncGuestWishlist
};
