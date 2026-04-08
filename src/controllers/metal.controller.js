const { Metal, Banner, Product } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseUtil');

exports.createMetal = async (req, res) => {
  try {
    console.log('Creating metal with body:', typeof req.body, req.body);
    
    // Auto-assign position if missing
    if (!req.body.position) {
      const highestMetal = await Metal.findOne().sort({ position: -1 }).limit(1);
      req.body.position = highestMetal ? (highestMetal.position || 0) + 1 : 1;
    }
    
    const metal = await Metal.create(req.body);
    return successResponse(res, 201, 'Metal created successfully', { metal });
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Error creating metal');
  }
};

exports.getAllMetals = async (req, res) => {
  try {
    const metals = await Metal.find().sort({ position: 1 });
    return successResponse(res, 200, 'Metals retrieved successfully', { metals });
  } catch (error) {
    console.error('Error in getAllMetals:', error);
    return errorResponse(res, 500, error.message || 'Error retrieving metals');
  }
};

exports.getMetal = async (req, res) => {
  try {
    const metal = await Metal.findById(req.params.id);
    if (!metal) {
      return errorResponse(res, 404, 'Metal not found');
    }
    return successResponse(res, 200, 'Metal retrieved successfully', { metal });
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Error retrieving metal');
  }
};

exports.updateMetal = async (req, res) => {
  try {
    const metal = await Metal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!metal) {
      return errorResponse(res, 404, 'Metal not found');
    }
    return successResponse(res, 200, 'Metal updated successfully', { metal });
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Error updating metal');
  }
};

exports.updateMetalPosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body;

    if (!direction || !['up', 'down'].includes(direction)) {
      return errorResponse(res, 400, "Invalid direction. Must be 'up' or 'down'");
    }

    const currentMetal = await Metal.findById(id);
    if (!currentMetal) return errorResponse(res, 404, "Metal not found");

    // Self-healing check: initialize positions for old database records that don't have them
    if (!currentMetal.position || currentMetal.position === 0) {
      const allMetals = await Metal.find();
      let pos = 1;
      for (const m of allMetals) {
        m.position = pos++;
        await m.save();
        if (m._id.toString() === id) {
          currentMetal.position = m.position;
        }
      }
    }

    const sortDirection = direction === 'up' ? -1 : 1;
    const positionQuery = direction === 'up' 
      ? { position: { $lt: currentMetal.position } }
      : { position: { $gt: currentMetal.position } };

    const adjacentMetal = await Metal.findOne(positionQuery).sort({ position: sortDirection }).limit(1);

    if (!adjacentMetal) {
      return errorResponse(res, 400, `Cannot move metal ${direction}. It's already at the ${direction === 'up' ? 'first' : 'last'} priority.`);
    }

    // Swap positions
    const tempPosition = currentMetal.position;
    currentMetal.position = adjacentMetal.position;
    adjacentMetal.position = tempPosition;

    await currentMetal.save();
    await adjacentMetal.save();

    return successResponse(res, 200, "Metal position updated successfully");
  } catch (error) {
    console.error("Update metal position error:", error);
    return errorResponse(res, 500, error.message || "Internal server error");
  }
};

exports.deleteMetal = async (req, res) => {
  try {
    const metal = await Metal.findById(req.params.id);
    if (!metal) {
      return errorResponse(res, 404, 'Metal not found');
    }

    // Dependency check: check if any active products are using this metal
    const productInUse = await Product.exists({ metalIds: req.params.id, isDeleted: false });
    if (productInUse) {
      return errorResponse(res, 400, "Cannot delete metal. It is currently being used by one or more active products.");
    }

    // Dependency check: check if any active banners are using this metal
    const bannerInUse = await Banner.exists({ metalIds: req.params.id, isDeleted: false });
    if (bannerInUse) {
      return errorResponse(res, 400, "Cannot delete metal. It is currently being used by one or more active banners.");
    }

    await Metal.findByIdAndDelete(req.params.id);
    return successResponse(res, 200, 'Metal deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Error deleting metal');
  }
};
