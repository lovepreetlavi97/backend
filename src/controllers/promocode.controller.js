const { 
    create, 
    findOne, 
    findMany, 
    findAndUpdate, 
    deleteOne 
  } = require('../services/mongodb/mongoService');
  const { PromoCode } = require('../models/index'); // Adjust the import based on your project structure
  
  // Create a new promo code
  const createPromoCode = async (req, res) => {
    try {
      const promoCodeData = req.body; // Get promo code data from request body
      console.log(promoCodeData,"promoCodeDatapromoCodeDatapromoCodeData")
      const promoCode = await create(PromoCode, promoCodeData); // Use the create service
      res.status(201).json(promoCode); // Respond with created promo code
    } catch (error) {
      res.status(400).json({ error: error.message }); // Handle errors
    }
  };
  
  // Get all promo codes
  const getAllPromoCodes = async (req, res) => {
    try {
      const promoCodes = await findMany(PromoCode); // Use the findMany service
      res.status(200).json(promoCodes); // Respond with list of promo codes
    } catch (error) {
      res.status(500).json({ error: error.message }); // Handle errors
    }
  };
  
  // Get a promo code by ID
  const getPromoCodeById = async (req, res) => {
    try {
      const promoCode = await findOne(PromoCode, { _id: req.params.id }); // Use the findOne service
      if (!promoCode) return res.status(404).json({ message: 'Promo code not found' });
      res.status(200).json(promoCode); // Respond with promo code details
    } catch (error) {
      res.status(500).json({ error: error.message }); // Handle errors
    }
  };
  
  // Update a promo code by ID
  const updatePromoCodeById = async (req, res) => {
    try {
      const promoCode = await findAndUpdate(PromoCode, { _id: req.params.id }, req.body); // Use the findAndUpdate service
      if (!promoCode) return res.status(404).json({ message: 'Promo code not found' });
      res.status(200).json(promoCode); // Respond with updated promo code
    } catch (error) {
      res.status(400).json({ error: error.message }); // Handle errors
    }
  };
  
  // Delete a promo code by ID
  const deletePromoCodeById = async (req, res) => {
    try {
      const result = await deleteOne(PromoCode, { _id: req.params.id }); // Use the deleteOne service
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Promo code not found' }); // Check if any document was deleted
      }
      res.status(204).send(); // Respond with no content on successful deletion
    } catch (error) {
      res.status(500).json({ error: error.message }); // Handle errors
    }
  };
  
  // Export the functions
  module.exports = {
    createPromoCode,
    getAllPromoCodes,
    getPromoCodeById,
    updatePromoCodeById,
    deletePromoCodeById,
  };
  