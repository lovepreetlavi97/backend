const { Cart, Product, Wishlist } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");
const { isValidId } = require("../utils/idUtils");

const syncGuestCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return errorResponse(res, 400, "Items array is required");
    }

    const validItems = items
      .filter(i => isValidId(i.productId))
      .map(i => ({
        productId: isNaN(Number(i.productId)) ? i.productId : Number(i.productId),
        quantity: Number(i.quantity) || 1,
      }));

    if (!validItems.length) {
      return errorResponse(res, 400, "No valid cart items found");
    }

    let cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      cart = await Cart.create({ userId, items: validItems });
    } else {
      let existingItems = Array.isArray(cart.items) ? [...cart.items] : [];
      validItems.forEach(gItem => {
        const idx = existingItems.findIndex(item => String(item.productId) === String(gItem.productId));
        if (idx > -1) {
          existingItems[idx].quantity += gItem.quantity;
        } else {
          existingItems.push(gItem);
        }
      });
      await cart.update({ items: existingItems });
    }

    await cacheUtils.del(`cart_${userId}`);
    await cacheUtils.del(`navbar_counts_${userId}`);

    return successResponse(res, 200, "Guest cart synced successfully", { cart });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to sync cart");
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { productId, quantity = 1 } = req.body;

    if (!isValidId(productId)) {
      return errorResponse(res, 400, "Invalid product ID");
    }

    let cart = await Cart.findOne({ where: { userId } });
    let itemsList = cart && Array.isArray(cart.items) ? [...cart.items] : [];

    const existingIndex = itemsList.findIndex(i => String(i.productId) === String(productId));
    if (existingIndex > -1) {
      itemsList[existingIndex].quantity += Number(quantity);
    } else {
      itemsList.push({ productId: isNaN(Number(productId)) ? productId : Number(productId), quantity: Number(quantity) });
    }

    if (!cart) {
      cart = await Cart.create({ userId, items: itemsList });
    } else {
      await cart.update({ items: itemsList });
    }

    const wishlist = await Wishlist.findOne({ where: { userId } });
    if (wishlist && Array.isArray(wishlist.products)) {
      const updatedWishlist = wishlist.products.filter(p => String(p) !== String(productId));
      await wishlist.update({ products: updatedWishlist });
    }

    return successResponse(res, 200, messages.ADDED_TO_CART, { cart });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { productId } = req.body;

    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      return errorResponse(res, 404, messages.CART_NOT_FOUND);
    }

    let itemsList = Array.isArray(cart.items) ? cart.items.filter(i => String(i.productId) !== String(productId)) : [];
    await cart.update({ items: itemsList });

    return successResponse(res, 200, messages.REMOVED_FROM_CART, { cart });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const getCart = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    let cart = await Cart.findOne({ where: { userId } });
    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    const items = Array.isArray(cart.items) ? cart.items : [];
    const productIds = items.map(i => i.productId);
    const products = productIds.length ? await Product.findAll({ where: { id: productIds } }) : [];

    const productMap = {};
    products.forEach(p => { productMap[p.id] = p; });

    const populatedItems = items.map(item => ({
      ...item,
      product: productMap[item.productId] || null
    }));

    return successResponse(res, 200, messages.CART_RETRIEVED, {
      cart: {
        id: cart.id,
        userId,
        items: populatedItems
      }
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { productId, action } = req.body;

    if (!productId || !["inc", "dec"].includes(action)) {
      return errorResponse(res, 400, "Invalid request body: productId and action are required.");
    }

    const cart = await Cart.findOne({ where: { userId } });
    if (!cart) return errorResponse(res, 404, "Cart not found");

    let itemsList = Array.isArray(cart.items) ? [...cart.items] : [];
    const idx = itemsList.findIndex(i => String(i.productId) === String(productId));

    if (idx === -1) {
      return errorResponse(res, 404, "Product not found in cart");
    }

    if (action === "inc") {
      itemsList[idx].quantity += 1;
    } else {
      itemsList[idx].quantity -= 1;
      if (itemsList[idx].quantity < 1) itemsList.splice(idx, 1);
    }

    await cart.update({ items: itemsList });
    return successResponse(res, 200, "Cart quantity updated successfully", { cart });
  } catch (error) {
    return errorResponse(res, 500, "Internal server error");
  }
};

module.exports = { addToCart, removeFromCart, getCart, updateCartQuantity, syncGuestCart };
