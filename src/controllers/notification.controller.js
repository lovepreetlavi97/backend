const { successResponse, errorResponse } = require('../utils/responseUtil');
const { Notification } = require('../models');
const { isValidId } = require('../utils/idUtils');
const { Op } = require('sequelize');

const getAdminNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, isRead, search } = req.query;
    const adminId = req.user.id || req.user._id;

    const where = {};
    if (type) where.type = type;
    if (isRead === 'true') where.isRead = true;
    if (isRead === 'false') where.isRead = false;
    if (search) {
      where.message = { [Op.like]: `%${search}%` };
    }

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      limit: parsedLimit,
      offset,
      order: [['id', 'DESC']]
    });

    return successResponse(res, 200, 'Notifications retrieved successfully', {
      notifications,
      pagination: {
        total: count,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(count / parsedLimit)
      }
    });
  } catch (e) {
    return errorResponse(res, 500, e.message || 'Failed to retrieve notifications');
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return errorResponse(res, 400, 'Invalid notification ID');
    }

    const notification = await Notification.findByPk(id);
    if (!notification) {
      return errorResponse(res, 404, 'Notification not found');
    }

    await notification.update({ isRead: true, readAt: new Date() });
    return successResponse(res, 200, 'Notification marked as read', { notification });
  } catch (e) {
    return errorResponse(res, 500, e.message || 'Failed to mark notification as read');
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const [updated] = await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { isRead: false } }
    );

    return successResponse(res, 200, 'All notifications marked as read', { updated });
  } catch (e) {
    return errorResponse(res, 500, e.message || 'Failed to mark notifications as read');
  }
};

module.exports = {
  getAdminNotifications,
  markNotificationRead,
  markAllNotificationsRead
};
