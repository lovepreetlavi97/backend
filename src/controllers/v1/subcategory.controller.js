// controllers/v1/subcategory.controller.js
const {Subcategory} = require('../../models/index'); // Assuming you have a Mongoose model

exports.createSubcategory = async (req, res) => {
  try {
    const { name, category } = req.body;
    const newSubcategory = new Subcategory({ name, category });
    const savedSubcategory = await newSubcategory.save();
    res.status(201).json(savedSubcategory);
  } catch (error) {
    res.status(400).json({ message: 'Bad Request', error: error.message });
  }
};

exports.getAllSubcategories = async (req, res) => {
  try {
    const subcategories = await Subcategory.find();
    res.status(200).json(subcategories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSubcategoryById = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }
    res.status(200).json(subcategory);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateSubcategoryById = async (req, res) => {
  try {
    const { name, category } = req.body;
    const updatedSubcategory = await Subcategory.findByIdAndUpdate(
      req.params.id,
      { name, category },
      { new: true }
    );
    if (!updatedSubcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }
    res.status(200).json(updatedSubcategory);
  } catch (error) {
    res.status(400).json({ message: 'Bad Request', error: error.message });
  }
};

exports.deleteSubcategoryById = async (req, res) => {
  try {
    const deletedSubcategory = await Subcategory.findByIdAndDelete(req.params.id);
    if (!deletedSubcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }
    res.status(204).send(); // No content
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
