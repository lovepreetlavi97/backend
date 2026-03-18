const {
  create,
  findOne,
  findMany,
  findAndUpdate,
  deleteOne
} = require('../services/mongodb/mongoService');
const { Cart, Wishlist } = require('../models/index'); // Ensure this matches your project structure
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const mongoose = require("mongoose");
const { cacheUtils } = require("../config/redis");

const syncGuestCart = async (req, res) => {
  try {
    console.log("syncGuestCart called", req.body);
    const userId = req.user._id;
    const { items } = req.body; // [{ productId, quantity }]

    if (!items || !Array.isArray(items)) {
      return errorResponse(res, 400, "Items array is required");
    }

    // Normalize + validate productIds
    const validItems = items
      .filter(i => mongoose.Types.ObjectId.isValid(i.productId))
      .map(i => ({
        productId: i.productId,
        quantity: Number(i.quantity) || 1,
      }));

    if (!validItems.length) {
      return errorResponse(res, 400, "No valid cart items found");
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId, items: validItems });
    } else {
      validItems.forEach(gItem => {
        const idx = cart.items.findIndex(
          item => item.productId.toString() === gItem.productId
        );

        if (idx > -1) {
          cart.items[idx].quantity += gItem.quantity;
        } else {
          cart.items.push(gItem);
        }
      });

      await cart.save();
    }

    const populatedCart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        select: "name slug actualPrice discountedPrice discountPercent weight images stock image isPriceFixed makingCharges",
        populate: { path: "priceRuleId", select: "name price" }
      })
      .lean();

    // Dynamic Price Calculation
    if (populatedCart && populatedCart.items) {
      populatedCart.items = populatedCart.items.map((item) => {
        const product = item.productId;
        if (product && !product.isPriceFixed && product.priceRuleId && product.priceRuleId.price) {
          const liveRate = product.priceRuleId.price;
          const weight = product.weight || 0;
          const making = product.makingCharges || 0;
          product.actualPrice = (liveRate * weight) + making;
          if (product.discountPercent && product.discountPercent > 0) {
            const discounted = product.actualPrice * (1 - (product.discountPercent / 100));
            product.discountedPrice = parseFloat(discounted.toFixed(2));
          }
        }
        return item;
      });
    }

    // clear cache if you using same caching pattern
    await cacheUtils.del(`cart_${userId}`);
    await cacheUtils.del(`navbar_counts_${userId}`);

    await cacheUtils.set(`cart_${userId}`, populatedCart, 600);

    return successResponse(res, 200, "Guest cart synced successfully", {
      cart: populatedCart
    });

  } catch (error) {
    console.error("Sync guest cart error:", error);
    return errorResponse(res, 500, error.message || "Failed to sync cart");
  }
};

module.exports = { syncGuestCart };

// Add to Cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, quantity } = req.body;

    let cart = await findOne(Cart, { userId });

    if (!cart) {
      cart = await create(Cart, {
        userId,
        items: [{ productId, quantity }]
      });
    } else {
      const productIndex = cart.items.findIndex(item => item.productId.toString() === productId);

      if (productIndex > -1) {
        cart.items[productIndex].quantity += quantity;
      } else {
        cart.items.push({ productId, quantity });
      }

      await cart.save();
    }
    await findAndUpdate(
      Wishlist,
      { userId },
      { $pull: { products: productId } },
      { new: true }
    );

    return successResponse(res, 200, messages.ADDED_TO_CART, { cart });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Remove from Cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    const cart = await findAndUpdate(
      Cart,
      { userId },
      { $pull: { items: { productId } } },
      { new: true }
    );

    if (!cart) {
      return errorResponse(res, 404, messages.CART_NOT_FOUND);
    }

    return successResponse(res, 200, messages.REMOVED_FROM_CART, { cart });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Get Cart
const getCart = async (req, res) => {
  try {
    console.log("pppppppppppppppp")
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        select:
          "name image slug actualPrice discountedPrice discountPercent weight images isPriceFixed makingCharges",
        populate: { path: "priceRuleId", select: "name price" },
      })
      .lean();

    if (!cart) {
      return errorResponse(res, 404, messages.CART_NOT_FOUND);
    }

    // Dynamic Price Calculation (align with trending-products)
    if (cart.items && cart.items.length) {
      cart.items = cart.items.map((item) => {
        const product = item.productId;

        if (!product) return item;

        // Dynamic price
        if (
          product.isPriceFixed === false &&
          product.priceRuleId &&
          product.priceRuleId.price
        ) {
          const pricePerUnit = product.priceRuleId.price;
          const weight = product.weight || 0;
          const makingCharges = product.makingCharges || 0;

          product.actualPrice = pricePerUnit * weight + makingCharges;

          // If discountPercent exists, compute discountedPrice from updated actualPrice
          if (product.discountPercent && product.discountPercent > 0) {
            const discounted = product.actualPrice * (1 - (product.discountPercent / 100));
            product.discountedPrice = parseFloat(discounted.toFixed(2));
          }
        }

        // Discount calculation
        if (
          product.actualPrice &&
          product.discountedPrice &&
          product.actualPrice > 0
        ) {
          product.discountPercentage = Math.round(
            ((product.actualPrice - product.discountedPrice) /
              product.actualPrice) *
            100
          );
        } else {
          product.discountPercentage = 0;
        }

        return item;
      });
    }

    return successResponse(res, 200, messages.CART_RETRIEVED, { cart });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};
const updateCartQuantity = async (req, res) => {
  console.log("updateCartQuantity called", req.body);
  try {
    const userId = req.user._id;
    const { productId, action } = req.body;

    // Validate input
    console.log("Validating input:", { productId, action });
    if (!productId || !["inc", "dec"].includes(action)) {
      return errorResponse(res, 400, "Invalid request body: productId and action are required.");
    }

    // Fetch user's cart
    const cart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        select: "name image slug actualPrice discountedPrice discountPercent weight images isPriceFixed makingCharges",
        populate: { path: "priceRuleId", select: "name price" }
      });
    if (!cart) return errorResponse(res, 404, "Cart not found");
    console.log("User's cart:", cart);
    // Find product in cart
    const productIndex = cart.items.findIndex((item) => {
      const match = item.productId._id.toString() == productId;
      console.log("checking item =>", item.productId._id.toString(), productId, match);
      return match;
    });


    if (productIndex === -1) {
      return errorResponse(res, 404, "Product not found in cart");
    }

    // Update quantity based on action
    const item = cart.items[productIndex];
    const newQty = action === "inc" ? item.quantity + 1 : item.quantity - 1;

    if (newQty < 1) {
      // Optional: auto-remove item from cart instead of throwing error
      return errorResponse(res, 400, "Quantity cannot be less than 1");
    }

    item.quantity = newQty;

    // Save changes
    await cart.save();

    // Return fully populated cart with dynamic prices
    const populatedCart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        select: "name image slug actualPrice discountedPrice discountPercent weight images isPriceFixed makingCharges",
        populate: { path: "priceRuleId", select: "name price" }
      })
      .lean();

    if (populatedCart && populatedCart.items) {
      populatedCart.items = populatedCart.items.map((item) => {
        const product = item.productId;
        if (product && !product.isPriceFixed && product.priceRuleId && product.priceRuleId.price) {
          const liveRate = product.priceRuleId.price;
          const weight = product.weight || 0;
          const making = product.makingCharges || 0;
          product.actualPrice = (liveRate * weight) + making;

          if (product.discountPercent && product.discountPercent > 0) {
            const discounted = product.actualPrice * (1 - (product.discountPercent / 100));
            product.discountedPrice = parseFloat(discounted.toFixed(2));
          }
        }
        return item;
      });
    }

    return successResponse(res, 200, "Cart quantity updated successfully", { cart: populatedCart });
  } catch (error) {
    console.error("Error in updateCartQuantity:", error);
    return errorResponse(res, 500, "Internal server error");
  }
};


module.exports = { addToCart, removeFromCart, getCart, updateCartQuantity, syncGuestCart };
