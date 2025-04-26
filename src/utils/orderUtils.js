/**
 * Utility functions for order operations
 */
const { Order } = require('../models/index');

/**
 * Generates a unique order number in the format ORD-YYYYMMDD-XXXX
 * where XXXX is a random 4-digit number
 * @returns {Promise<string>} A unique order number
 */
const generateOrderNumber = async () => {
  // Generate date part of order number (YYYYMMDD)
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  
  // Keep trying until we find a unique order number
  let isUnique = false;
  let orderNumber;
  let attempts = 0;
  
  while (!isUnique && attempts < 10) {
    // Generate random 4-digit number
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    // Combine parts to create order number
    orderNumber = `ORD-${dateStr}-${randomPart}`;
    
    // Check if this order number already exists
    const existingOrder = await Order.findOne({ orderNumber });
    if (!existingOrder) {
      isUnique = true;
    }
    
    attempts++;
  }
  
  if (!isUnique) {
    // If we couldn't generate a unique number after 10 attempts, 
    // use timestamp for guaranteed uniqueness
    const timestamp = Date.now().toString().slice(-6);
    orderNumber = `ORD-${dateStr}-${timestamp}`;
  }
  
  return orderNumber;
};

module.exports = {
  generateOrderNumber
}; 