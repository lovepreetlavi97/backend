const { 
  create, 
  findOne, 
  findMany, 
  findAndUpdate, 
  deleteOne 
} = require('../services/mongodb/mongoService');
const { Category } = require('../models/index'); // Adjust the import based on your project structure

// Create a new category
const createCategory = async (req, res) => {
  try {
    const categoryData = req.body; // Get the category data from the request body
    const category = await create(Category, categoryData); // Use the create service function
    res.status(201).json(category); // Respond with the created category
  } catch (error) {
    res.status(400).json({ error: error.message }); // Handle errors
  }
};

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await findMany(Category); // Use the findMany service function
    res.status(200).json(categories); // Respond with the list of categories
  } catch (error) {
    res.status(500).json({ error: error.message }); // Handle errors
  }
};

// Get a category by ID
const getCategoryById = async (req, res) => {
  try {
    const category = await findOne(Category, { _id: req.params.id }); // Use the findOne service function
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json(category); // Respond with the category details
  } catch (error) {
    res.status(500).json({ error: error.message }); // Handle errors
  }
};

// Update a category by ID
const updateCategoryById = async (req, res) => {
  try {
    const category = await findAndUpdate(Category, { _id: req.params.id }, req.body); // Use the findAndUpdate service function
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json(category); // Respond with the updated category
  } catch (error) {
    res.status(400).json({ error: error.message }); // Handle errors
  }
};

// Delete a category by ID
const deleteCategoryById = async (req, res) => {
  try {
    const result = await deleteOne(Category, { _id: req.params.id }); // Use the deleteOne service function
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Category not found' }); // Check if any document was deleted
    }
    res.status(204).send(); // Respond with no content on successful deletion
  } catch (error) {
    res.status(500).json({ error: error.message }); // Handle errors
  }
};

// Export the functions
module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
};
