const mongoose = require("mongoose");

const WishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product", index: true }]
}, { timestamps: true });

WishlistSchema.index({ userId: 1 });

const Wishlist = mongoose.model("Wishlist", WishlistSchema);
module.exports = Wishlist;
