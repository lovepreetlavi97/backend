const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category', // Assuming you have subcategories in the same collection
  }],
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
