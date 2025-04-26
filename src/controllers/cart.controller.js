const {
    create,
    findOne,
    findMany,
    findAndUpdate,
    deleteOne
  } = require('../services/mongodb/mongoService');
  const { Cart ,Wishlist} = require('../models/index'); // Ensure this matches your project structure
  const { successResponse, errorResponse } = require("../utils/responseUtil");
  const messages = require("../utils/messages");
  
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
          const userId = req.user._id;
          const cart = await Cart.findOne({ userId }).populate("items.productId",   "name actualPrice discountedPrice weight images");
  
          if (!cart) {
              return errorResponse(res, 404, messages.CART_NOT_FOUND);
          }
  
          return successResponse(res, 200, messages.CART_RETRIEVED, { cart });
      } catch (error) {
          return errorResponse(res, 500, error.message);
      }
  };
  const updateCartQuantity = async (req, res) => {
    console.log("updateCartQuantity called",req.body);
    try {
      const userId = req.user._id;
      const { productId, action } = req.body;
  
      // Validate input
      if (!productId || !["inc", "dec"].includes(action)) {
        return errorResponse(res, 400, "Invalid request body: productId and action are required.");
      }
  
      // Fetch user's cart
      const cart = await findOne(Cart, { userId });
      if (!cart) return errorResponse(res, 404, "Cart not found");
  
      // Find product in cart
      const productIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );
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
  
      return successResponse(res, 200, "Cart quantity updated successfully", { cart });
    } catch (error) {
      console.error("Error in updateCartQuantity:", error);
      return errorResponse(res, 500, "Internal server error");
    }
  };
  
  
  module.exports = { addToCart, removeFromCart, getCart ,updateCartQuantity};
  