const { Notification, Admin, User } = require('../../models');
const { sendEmail } = require('./email.service');

// Create notifications for all active admins
async function createAdminOrderNotifications(type, order, extra = {}) {
  try {
    const admins = await Admin.find({ role: { $in: ['admin', 'superadmin'] }, status: 'active' });
    if (!admins || admins.length === 0) return;

    // Fetch user name
    const user = await User.findById(order.userId).select('name email');
    const userName = user?.name || user?.email || 'Unknown User';

    const subjectMap = {
      NEW_ORDER: 'New Order Placed',
      ORDER_CANCELLED: 'Order Cancelled',
      ORDER_RETURNED: 'Order Returned',
      ORDER_REFUNDED: 'Order Refunded'
    };

    const messageMap = {
      NEW_ORDER: `New order ${order.orderNumber} placed by ${userName}`,
      ORDER_CANCELLED: `Order ${order.orderNumber} has been cancelled by ${userName}`,
      ORDER_RETURNED: `Order ${order.orderNumber} has been marked as Returned`,
      ORDER_REFUNDED: `Order ${order.orderNumber} has been refunded`
    };

    const subject = subjectMap[type] || 'Order Update';
    const baseMessage = messageMap[type] || 'Order update';
    const htmlTemplate = (admin) => `
      <h2>${subject}</h2>
      <p>${baseMessage}</p>
      <p><strong>Order Number:</strong> ${order.orderNumber}</p>
      <p><strong>Amount:</strong> ${order.totalAmount}</p>
      <p><strong>Status:</strong> ${order.status}</p>
      <p style="font-size:12px;color:#666">This is an automated notification.</p>
    `;

    const notifications = admins.map(a => ({
      adminId: a._id,
      userId: order.userId,
      userName: userName,
      orderId: order._id,
      type,
      message: baseMessage,
      metadata: { finalAmount: order.finalAmount, ...extra }
    }));

    await Notification.insertMany(notifications);

    // Fire-and-forget email sending
    admins.forEach(a => {
      sendEmail(a.email, subject, htmlTemplate(a)).catch(err => console.error('Admin email failed', err.message));
    });
  } catch (err) {
    console.error('createAdminOrderNotifications error', err.message);
  }
}

module.exports = { createAdminOrderNotifications };
