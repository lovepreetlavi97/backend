const mongoose = require('mongoose');

// Define the default image URL as a constant for reusability
const DEFAULT_IMAGE_URL = "https://plus.unsplash.com/premium_photo-1664124381855-3131b9a386d8?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true, // Trim whitespace from the name
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category', // Reference to the Category model
    required: false, // Ensure every subcategory is tied to a category
  },
  images: {
    type: [String], // Declares it as an array of strings
    default: [DEFAULT_IMAGE_URL] // Sets the default as an array with the default URL
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Subcategory', subcategorySchema);
