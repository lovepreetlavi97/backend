const Festival = require('../models/festival.model'); // Replace with your actual model

// Create a new festival
const createFestival = async (req, res) => {
  try {
    const festival = new Festival(req.body);
    await festival.save();
    res.status(201).json(festival);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all festivals
const getAllFestivals = async (req, res) => {
  try {
    const festivals = await Festival.find();
    res.status(200).json(festivals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a festival by ID
const getFestivalById = async (req, res) => {
  try {
    const festival = await Festival.findById(req.params.id);
    if (!festival) return res.status(404).json({ message: 'Festival not found' });
    res.status(200).json(festival);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a festival by ID
const updateFestivalById = async (req, res) => {
  try {
    const festival = await Festival.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!festival) return res.status(404).json({ message: 'Festival not found' });
    res.status(200).json(festival);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a festival by ID
const deleteFestivalById = async (req, res) => {
  try {
    const festival = await Festival.findByIdAndDelete(req.params.id);
    if (!festival) return res.status(404).json({ message: 'Festival not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Exporting functions
module.exports = {
  createFestival,
  getAllFestivals,
  getFestivalById,
  updateFestivalById,
  deleteFestivalById,
};
