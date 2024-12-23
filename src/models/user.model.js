const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
    lowercase: true,
  },
  password: {
    type: String,
    required: false,
  },
  phoneNumber: {
    type: Number,
    required: false,
  },
  role: {
    type: String,
    default: 'user',
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
