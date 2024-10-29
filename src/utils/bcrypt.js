const bcrypt = require('bcryptjs');

// Function to hash the password
const hashPassword = async (password) => {
  const saltRounds = 10; // The higher the number, the more secure, but slower the hashing
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};

// Function to compare a plain text password with a hashed password
const comparePassword = async (plainPassword, hashedPassword) => {
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return isMatch;
};

module.exports = {
  hashPassword,
  comparePassword
};
