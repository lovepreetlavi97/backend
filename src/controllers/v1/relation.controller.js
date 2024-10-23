const Relation = require('../../models/relation.model'); // Replace with your actual model

// Create a new relation
exports.createRelation = async (req, res) => {
  try {
    const relation = new Relation(req.body);
    await relation.save();
    res.status(201).json(relation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all relations
exports.getAllRelations = async (req, res) => {
  try {
    const relations = await Relation.find();
    res.status(200).json(relations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a relation by ID
exports.getRelationById = async (req, res) => {
  try {
    const relation = await Relation.findById(req.params.id);
    if (!relation) return res.status(404).json({ message: 'Relation not found' });
    res.status(200).json(relation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a relation by ID
exports.updateRelationById = async (req, res) => {
  try {
    const relation = await Relation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!relation) return res.status(404).json({ message: 'Relation not found' });
    res.status(200).json(relation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a relation by ID
exports.deleteRelationById = async (req, res) => {
  try {
    const relation = await Relation.findByIdAndDelete(req.params.id);
    if (!relation) return res.status(404).json({ message: 'Relation not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
