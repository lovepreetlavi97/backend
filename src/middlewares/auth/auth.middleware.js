const jwt = require('jsonwebtoken');
const { Admin, User } = require('../../models/index'); // Import your Admin and User models
const { findOne } = require('../../services/mongodb/mongoService'); // Make sure to import findOne

const authMiddleware = (role) => {
  console.log("auth")
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1]; // Get token from the Authorization header
      if (!token) return res.status(401).json({ message: 'No token provided' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your secret

      let user;
      if (role === 'admin') {
        user = await findOne(Admin, { _id: decoded.id });
        if (!user) return res.status(404).json({ message: 'Admin not found' });
      } else if (role === 'user') {
        user = await findOne(User, { _id: decoded.id });
        if (!user) return res.status(404).json({ message: 'User not found' });
      }

      req.user = user; // Attach the user to the request object
      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(401).json({ message: 'Unauthorized' });
    }
  };
};

module.exports = authMiddleware;
