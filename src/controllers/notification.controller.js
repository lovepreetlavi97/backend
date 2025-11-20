const mongoose = require('mongoose');
const { successResponse, errorResponse } = require('../utils/responseUtil');
const { Notification } = require('../models');

// GET /admin/notifications
// Query params: page, limit, type, isRead, startDate, endDate, search
const getAdminNotifications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      isRead,
      startDate,
      endDate,
      search
    } = req.query;

    const query = { adminId: new mongoose.Types.ObjectId(req.user._id) };

    if (type) query.type = type;
    if (isRead === 'true') query.isRead = true;
    if (isRead === 'false') query.isRead = false;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateObj;
      }
    }

    if (search) {
      query.$or = [
        { message: { $regex: search, $options: 'i' } },
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Notification.countDocuments(query);

    return successResponse(res, 200, 'Notifications retrieved successfully', {
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (e) {
    console.error('Get Admin Notifications Error:', e);
    return errorResponse(res, 500, e.message || 'Failed to retrieve notifications');
  }
};

// PATCH /admin/notifications/:id/read
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, 'Invalid notification ID');
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: id, adminId: req.user._id },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    );

    if (!notification) {
      return errorResponse(res, 404, 'Notification not found');
    }

    return successResponse(res, 200, 'Notification marked as read', { notification });
  } catch (e) {
    console.error('Mark Notification Read Error:', e);
    return errorResponse(res, 500, e.message || 'Failed to mark notification as read');
  }
};

// PATCH /admin/notifications/read-all
const markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { adminId: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return successResponse(res, 200, 'All notifications marked as read', { updated: result.modifiedCount });
  } catch (e) {
    console.error('Mark All Notifications Read Error:', e);
    return errorResponse(res, 500, e.message || 'Failed to mark notifications as read');
  }
};

module.exports = {
  getAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
