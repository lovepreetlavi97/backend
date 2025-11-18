const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middlewares/auth/auth.middleware');
const notificationController = require('../controllers/notification.controller');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Admin notifications for order events
 */

/**
 * @swagger
 * /admin/notifications:
 *   get:
 *     summary: Get admin notifications (paginated)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [NEW_ORDER, ORDER_CANCELLED, ORDER_RETURNED, ORDER_REFUNDED] }
 *       - in: query
 *         name: isRead
 *         schema: { type: string, enum: [true, false] }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notifications retrieved
 */
router.get('/', adminAuth, notificationController.getAdminNotifications);

/**
 * @swagger
 * /admin/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
router.patch('/:id/read', adminAuth, notificationController.markNotificationRead);

/**
 * @swagger
 * /admin/notifications/read-all:
 *   patch:
 *     summary: Mark all unread notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch('/read-all', adminAuth, notificationController.markAllNotificationsRead);

module.exports = router;
