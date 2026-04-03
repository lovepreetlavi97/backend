/**
 * Middleware to extract jewelry type (Gold/Silver) from headers
 * and attach it to the request object for use in controllers.
 */
const jewelryTypeMiddleware = (req, res, next) => {
  const jewelryType = req.headers['x-jewelry-type'];
  
  if (jewelryType) {
    // Normalize to capitalized for database matching if necessary, 
    // or just pass as is. Let's pass as is but add helper.
    req.jewelryType = jewelryType;
    
    // Also inject into query as 'material' for default behavior in some controllers
    if (!req.query.material) {
      req.query.material = jewelryType.charAt(0).toUpperCase() + jewelryType.slice(1);
    }
  }
  
  next();
};

module.exports = jewelryTypeMiddleware;
