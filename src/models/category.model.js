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
  image: {
    type: Object,
    default: {},
  },
  isDeleted: {
    type: Boolean,
    default:false,
  },
  isBlocked: {
    type: Boolean,
    default:false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
