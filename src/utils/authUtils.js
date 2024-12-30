const jwt = require('jsonwebtoken');

// Function to generate OTP
const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
};

// Function to generate JWT token
const generateJWT = (userId) => {
  const token = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET_KEY,
    {
      // expiresIn: "1h", // Optional, Uncomment if you need token expiration
    }
  );
  return token;
};

module.exports = {
  generateOTP,
  generateJWT,
};
