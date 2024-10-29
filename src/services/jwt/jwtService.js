// services/jwtService.js
const jwt = require('jsonwebtoken');

// Function to create a JWT token
console.log( process.env.JWT_SECRET_KEY," process.env.JWT_SECRET_KEY process.env.JWT_SECRET_KEY process.env.JWT_SECRET_KEY")
const createToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1h' }); // Set expiration time as needed
};

// Function to verify a JWT token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET_KEY);
};

module.exports = {
  createToken,
  verifyToken,
};
