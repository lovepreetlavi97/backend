const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category', // Reference to the Category model
    required: true,
  },
}, { timestamps: true });

const Subcategory = mongoose.model('Subcategory', subcategorySchema);

module.exports = Subcategory;
