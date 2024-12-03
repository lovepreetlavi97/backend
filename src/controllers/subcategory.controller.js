const { 
  create, 
  findOne, 
  findMany, 
  findAndUpdate, 
  deleteOne 
} = require('../services/mongodb/mongoService');
const { Subcategory } = require('../models/index'); // Adjust the import based on your project structure

// Create a new subcategory
exports.createSubcategory = async (req, res) => {
  try {
    const subcategoryData = req.body; // Get subcategory data from request body
    const subcategory = await create(Subcategory, subcategoryData); // Use the create service function
    res.status(201).json(subcategory); // Respond with the created subcategory
  } catch (error) {
    res.status(400).json({ error: error.message }); // Handle errors
  }
};

// Get all subcategories
exports.getAllSubcategories = async (req, res) => {
  try {
    console.log("Fetching all subcategories with populated category");

    // Query and projection
    const query = {}; // Fetch all subcategories
    const projection = {}; // Fetch all fields of subcategories

    // Populate categoryId with only the name field of the category
    const populate = { path: 'categoryId', select: 'name' };

    const subcategories = await findMany(Subcategory, query, projection, {}, populate);

    res.status(200).json(subcategories); // Respond with populated subcategories
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).json({ error: error.message }); // Handle errors
  }
};



// Get a subcategory by ID
exports.getSubcategoryById = async (req, res) => {
  try {
    const subcategory = await findOne(Subcategory, { _id: req.params.id }); // Use the findOne service function
    if (!subcategory) return res.status(404).json({ message: 'Subcategory not found' });
    res.status(200).json(subcategory); // Respond with the subcategory details
  } catch (error) {
    res.status(500).json({ error: error.message }); // Handle errors
  }
};

// Update a subcategory by ID
exports.updateSubcategoryById = async (req, res) => {
  try {
    const subcategory = await findAndUpdate(Subcategory, { _id: req.params.id }, req.body); // Use the findAndUpdate service function
    if (!subcategory) return res.status(404).json({ message: 'Subcategory not found' });
    res.status(200).json(subcategory); // Respond with the updated subcategory
  } catch (error) {
    res.status(400).json({ error: error.message }); // Handle errors
  }
};

// Delete a subcategory by ID
exports.deleteSubcategoryById = async (req, res) => {
  try {
    const result = await deleteOne(Subcategory, { _id: req.params.id }); // Use the deleteOne service function
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Subcategory not found' }); // Check if any document was deleted
    }
    res.status(204).send(); // Respond with no content on successful deletion
  } catch (error) {
    res.status(500).json({ error: error.message }); // Handle errors
  }
};
