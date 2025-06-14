const { 
  create, 
  findOne, 
  findMany, 
  findAndUpdate, 
  deleteOne,
  countDocuments
} = require('../services/mongodb/mongoService');
const { Grievance } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");

/**
 * Get all grievances with pagination and filtering
 */
const getAllGrievances = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      type, 
      priority, 
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = { isDeleted: false };
    
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;

    // Cache key based on query parameters
    const cacheKey = `grievances_${page}_${limit}_${search || ''}_${type || ''}_${priority || ''}_${status || ''}_${sortBy}_${sortOrder}`;
    
    // Try to get from cache
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      return successResponse(res, 200, "Grievances retrieved successfully", cachedData);
    }

    // Count total documents for pagination
    const total = await countDocuments(Grievance, filter);
    
    // Calculate pagination values
    const pages = Math.ceil(total / limit);
    const currentPage = parseInt(page);
    const skip = (currentPage - 1) * parseInt(limit);
    
    // Sort configuration
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Fetch grievances with pagination
    const grievances = await findMany(
      Grievance,
      filter,
      { skip, limit: parseInt(limit), sort, 
        populate: [
          { path: 'userId', select: 'name email' },
          { path: 'assignedTo', select: 'name email' },
          { path: 'replies.userId', select: 'name email' }
        ]
      }
    );
    
    const responseData = {
      grievances,
      pagination: {
        total,
        page: currentPage,
        limit: parseInt(limit),
        pages
      }
    };
    
    // Cache the result
    await cacheUtils.set(cacheKey, responseData, 300); // Cache for 5 minutes
    
    return successResponse(res, 200, "Grievances retrieved successfully", responseData);
  } catch (error) {
    console.error("Get all grievances error:", error);
    return errorResponse(res, 500, error.message || "Failed to retrieve grievances");
  }
};

/**
 * Get a single grievance by ID
 */
const getGrievanceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Cache key
    const cacheKey = `grievance_${id}`;
    
    // Try to get from cache
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      return successResponse(res, 200, "Grievance retrieved successfully", { grievance: cachedData });
    }
    
    const grievance = await findOne(
      Grievance,
      { _id: id, isDeleted: false },
      { 
        populate: [
          { path: 'userId', select: 'name email' },
          { path: 'assignedTo', select: 'name email' },
          { path: 'replies.userId', select: 'name email' }
        ]
      }
    );
    
    if (!grievance) {
      return errorResponse(res, 404, "Grievance not found");
    }
    
    // Cache the result
    await cacheUtils.set(cacheKey, grievance, 300); // Cache for 5 minutes
    
    return successResponse(res, 200, "Grievance retrieved successfully", { grievance });
  } catch (error) {
    console.error("Get grievance error:", error);
    return errorResponse(res, 500, error.message || "Failed to retrieve grievance");
  }
};

/**
 * Create a new grievance
 */
const createGrievance = async (req, res) => {
  try {
    const { 
      userId, 
      type, 
      subject, 
      description, 
      priority, 
      orderNumber 
    } = req.body;
    
    if (!userId || !type || !subject || !description) {
      return errorResponse(res, 400, "Missing required fields");
    }
    
    // Handle file uploads if any
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // For S3 uploads, use the location property
        if (file.location) {
          attachments.push(file.location);
        } 
        // For local uploads, format the path
        else if (file.path) {
          const formattedPath = file.path.replace(/\\/g, '/').split('public/')[1];
          attachments.push(formattedPath);
        }
      }
    }
    
    const grievanceData = {
      userId,
      type,
      subject,
      description,
      priority: priority || 'medium',
      orderNumber,
      attachments,
      status: 'open'
    };
    
    const grievance = await create(Grievance, grievanceData);
    
    // Clear cache
    await cacheUtils.deletePattern('grievances_*');
    
    return successResponse(res, 201, "Grievance created successfully", { grievance });
  } catch (error) {
    console.error("Create grievance error:", error);
    return errorResponse(res, 500, error.message || "Failed to create grievance");
  }
};

/**
 * Update grievance status
 */
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return errorResponse(res, 400, "Invalid status value");
    }
    
    const grievance = await findAndUpdate(
      Grievance,
      { _id: id, isDeleted: false },
      { status }
    );
    
    if (!grievance) {
      return errorResponse(res, 404, "Grievance not found");
    }
    
    // Clear cache
    await cacheUtils.deletePattern(`grievance_${id}`);
    await cacheUtils.deletePattern('grievances_*');
    
    return successResponse(res, 200, "Grievance status updated successfully", { grievance });
  } catch (error) {
    console.error("Update status error:", error);
    return errorResponse(res, 500, error.message || "Failed to update grievance status");
  }
};

/**
 * Update grievance priority
 */
const updatePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    
    if (!priority || !['high', 'medium', 'low'].includes(priority)) {
      return errorResponse(res, 400, "Invalid priority value");
    }
    
    const grievance = await findAndUpdate(
      Grievance,
      { _id: id, isDeleted: false },
      { priority }
    );
    
    if (!grievance) {
      return errorResponse(res, 404, "Grievance not found");
    }
    
    // Clear cache
    await cacheUtils.deletePattern(`grievance_${id}`);
    await cacheUtils.deletePattern('grievances_*');
    
    return successResponse(res, 200, "Grievance priority updated successfully", { grievance });
  } catch (error) {
    console.error("Update priority error:", error);
    return errorResponse(res, 500, error.message || "Failed to update grievance priority");
  }
};

/**
 * Add a reply to a grievance
 */
const addReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user._id; // From auth middleware
    
    if (!message) {
      return errorResponse(res, 400, "Reply message is required");
    }
    
    const grievance = await findOne(Grievance, { _id: id, isDeleted: false });
    
    if (!grievance) {
      return errorResponse(res, 404, "Grievance not found");
    }
    
    // Add reply to the grievance
    grievance.replies.push({
      userId,
      message,
      createdAt: new Date()
    });
    
    // If the grievance is open and an admin is replying, change status to in_progress
    if (grievance.status === 'open' && req.user.role === 'admin') {
      grievance.status = 'in_progress';
    }
    
    await grievance.save();
    
    // Clear cache
    await cacheUtils.deletePattern(`grievance_${id}`);
    await cacheUtils.deletePattern('grievances_*');
    
    return successResponse(res, 200, "Reply added successfully", { grievance });
  } catch (error) {
    console.error("Add reply error:", error);
    return errorResponse(res, 500, error.message || "Failed to add reply");
  }
};

/**
 * Assign grievance to an admin
 */
const assignGrievance = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;
    
    if (!adminId) {
      return errorResponse(res, 400, "Admin ID is required");
    }
    
    const grievance = await findAndUpdate(
      Grievance,
      { _id: id, isDeleted: false },
      { assignedTo: adminId }
    );
    
    if (!grievance) {
      return errorResponse(res, 404, "Grievance not found");
    }
    
    // Clear cache
    await cacheUtils.deletePattern(`grievance_${id}`);
    await cacheUtils.deletePattern('grievances_*');
    
    return successResponse(res, 200, "Grievance assigned successfully", { grievance });
  } catch (error) {
    console.error("Assign grievance error:", error);
    return errorResponse(res, 500, error.message || "Failed to assign grievance");
  }
};

/**
 * Delete a grievance (soft delete)
 */
const deleteGrievance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const grievance = await findAndUpdate(
      Grievance,
      { _id: id, isDeleted: false },
      { isDeleted: true }
    );
    
    if (!grievance) {
      return errorResponse(res, 404, "Grievance not found");
    }
    
    // Clear cache
    await cacheUtils.deletePattern(`grievance_${id}`);
    await cacheUtils.deletePattern('grievances_*');
    
    return successResponse(res, 200, "Grievance deleted successfully");
  } catch (error) {
    console.error("Delete grievance error:", error);
    return errorResponse(res, 500, error.message || "Failed to delete grievance");
  }
};

/**
 * Get grievance analytics
 */
const getGrievanceAnalytics = async (req, res) => {
  try {
    // Cache key
    const cacheKey = 'grievance_analytics';
    
    // Try to get from cache
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      return successResponse(res, 200, "Grievance analytics retrieved successfully", cachedData);
    }
    
    // Count by status
    const openCount = await countDocuments(Grievance, { status: 'open', isDeleted: false });
    const inProgressCount = await countDocuments(Grievance, { status: 'in_progress', isDeleted: false });
    const resolvedCount = await countDocuments(Grievance, { status: 'resolved', isDeleted: false });
    const closedCount = await countDocuments(Grievance, { status: 'closed', isDeleted: false });
    
    // Count by priority
    const highPriorityCount = await countDocuments(Grievance, { priority: 'high', isDeleted: false });
    const mediumPriorityCount = await countDocuments(Grievance, { priority: 'medium', isDeleted: false });
    const lowPriorityCount = await countDocuments(Grievance, { priority: 'low', isDeleted: false });
    
    // Count by type
    const productCount = await countDocuments(Grievance, { type: 'product', isDeleted: false });
    const deliveryCount = await countDocuments(Grievance, { type: 'delivery', isDeleted: false });
    const serviceCount = await countDocuments(Grievance, { type: 'service', isDeleted: false });
    const paymentCount = await countDocuments(Grievance, { type: 'payment', isDeleted: false });
    const otherCount = await countDocuments(Grievance, { type: 'other', isDeleted: false });
    
    const analytics = {
      totalGrievances: openCount + inProgressCount + resolvedCount + closedCount,
      byStatus: {
        open: openCount,
        in_progress: inProgressCount,
        resolved: resolvedCount,
        closed: closedCount
      },
      byPriority: {
        high: highPriorityCount,
        medium: mediumPriorityCount,
        low: lowPriorityCount
      },
      byType: {
        product: productCount,
        delivery: deliveryCount,
        service: serviceCount,
        payment: paymentCount,
        other: otherCount
      }
    };
    
    // Cache the result
    await cacheUtils.set(cacheKey, analytics, 600); // Cache for 10 minutes
    
    return successResponse(res, 200, "Grievance analytics retrieved successfully", analytics);
  } catch (error) {
    console.error("Get grievance analytics error:", error);
    return errorResponse(res, 500, error.message || "Failed to retrieve grievance analytics");
  }
};

module.exports = {
  getAllGrievances,
  getGrievanceById,
  createGrievance,
  updateStatus,
  updatePriority,
  addReply,
  assignGrievance,
  deleteGrievance,
  getGrievanceAnalytics
};
