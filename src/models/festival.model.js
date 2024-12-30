const mongoose = require('mongoose');

const festivalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  isDeleted: {
    type: Boolean,
    default: false, // Indicates whether the festival is deleted or not
  },
  isBlocked: {
    type: Boolean,
    default: false, // Indicates whether the festival is blocked or not
  }
}, { timestamps: true });

module.exports = mongoose.model('Festival', festivalSchema);
