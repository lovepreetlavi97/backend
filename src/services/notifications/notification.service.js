const { Notification, Admin, User } = require('../../models');
const { sendEmail } = require('./email.service');

// Create notifications for all active admins
// async function createAdminOrderNotifications(type, order, extra = {}) {
//   try {
//     const admins = await Admin.find({ role: { $in: ['admin', 'superadmin'] }, status: 'active' });
//     if (!admins || admins.length === 0) return;

//     // Fetch user name
//     const user = await User.findById(order.userId).select('name email');
//     const userName = user?.name || user?.email || 'Unknown User';

//     const subjectMap = {
//       NEW_ORDER: 'New Order Placed',
//       ORDER_CANCELLED: 'Order Cancelled',
//       ORDER_RETURNED: 'Order Returned',
//       ORDER_REFUNDED: 'Order Refunded'
//     };

//     const messageMap = {
//       NEW_ORDER: `New order ${order.orderNumber} placed by ${userName}`,
//       ORDER_CANCELLED: `Order ${order.orderNumber} has been cancelled by ${userName}`,
//       ORDER_RETURNED: `Order ${order.orderNumber} has been marked as Returned`,
//       ORDER_REFUNDED: `Order ${order.orderNumber} has been refunded`
//     };

//     const subject = subjectMap[type] || 'Order Update';
//     const baseMessage = messageMap[type] || 'Order update';
//     const htmlTemplate = (admin) => `
//       <h2>${subject}</h2>
//       <p>${baseMessage}</p>
//       <p><strong>Order Number:</strong> ${order.orderNumber}</p>
//       <p><strong>Amount:</strong> ${order.totalAmount}</p>
//       <p><strong>Status:</strong> ${order.status}</p>
//       <p style="font-size:12px;color:#666">This is an automated notification.</p>
//     `;

//     const notifications = admins.map(a => ({
//       adminId: a._id,
//       userId: order.userId,
//       userName: userName,
//       orderId: order._id,
//       type,
//       message: baseMessage,
//       metadata: { finalAmount: order.finalAmount, ...extra }
//     }));

//     await Notification.insertMany(notifications);

//     // Fire-and-forget email sending
//     admins.forEach(a => {
//       sendEmail(a.email, subject, htmlTemplate(a)).catch(err => console.error('Admin email failed', err.message));
//     });
//   } catch (err) {
//     console.error('createAdminOrderNotifications error', err.message);
//   }
// }
function generateAdminOrderEmailHTML(order, userName, userEmail) {
  const productRows = order.products.map(p => `
    <tr style="border-bottom:1px solid #eaeaea;">
      <td style="padding:10px;">
        <img src="${p.image}" width="70" style="border-radius:6px" />
      </td>
      <td style="padding:10px;">
        <strong>${p.name}</strong><br/>
        <small style="color:#666">Product ID: ${p.productId}</small><br/>
        <small>SKU: ${p.sku || '-'}</small>
      </td>
      <td align="center">${p.quantity}</td>
      <td align="right">₹${p.price}</td>
      <td align="right">₹${p.subtotal}</td>
    </tr>
  `).join('');

  return `
  <div style="font-family:Arial, sans-serif; background:#f6f6f6; padding:20px;">
    <div style="max-width:760px; margin:auto; background:#fff; border-radius:10px; padding:24px;">
      
      <h2>🆕 New Order Received</h2>

      <p>
        <strong>Order No:</strong> ${order.orderNumber}<br/>
        <strong>User:</strong> ${userName} (${userEmail})<br/>
        <strong>Payment:</strong> ${order.paymentMethod} (${order.paymentStatus})<br/>
        <strong>Status:</strong> ${order.status}
      </p>

      <hr/>

      <h3>📦 Products</h3>

      <table width="100%" cellspacing="0" cellpadding="0">
        <thead style="background:#fafafa;">
          <tr>
            <th></th>
            <th align="left">Product</th>
            <th>Qty</th>
            <th align="right">Price</th>
            <th align="right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${productRows}
        </tbody>
      </table>

      <hr/>

      <h3>💰 Order Summary</h3>
      <table width="100%">
        <tr><td>Subtotal</td><td align="right">₹${order.subtotal}</td></tr>
        <tr><td>Shipping</td><td align="right">₹${order.shippingCharge}</td></tr>
        <tr><td>Tax</td><td align="right">₹${order.taxAmount}</td></tr>
        <tr><td>Discount</td><td align="right">-₹${order.discountAmount}</td></tr>
        <tr>
          <td><strong>Final Amount</strong></td>
          <td align="right"><strong>₹${order.finalAmount}</strong></td>
        </tr>
      </table>

      <hr/>

      <h3>🚚 Shipping Address</h3>
      <p>
        ${order.shippingAddress.contactName}<br/>
        ${order.shippingAddress.addressLine1}<br/>
        ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}<br/>
        Phone: ${order.shippingAddress.contactPhone}
      </p>

      <p style="font-size:12px; color:#777;">
        Internal notification for admin use only.
      </p>

    </div>
  </div>
  `;
}
async function createAdminOrderNotifications(type, order, extra = {}) {
  try {
    const admins = await Admin.find({
      role: { $in: ['admin', 'superadmin'] },
      status: 'active'
    });
    if (!admins.length) return;

    const user = await User.findById(order.userId).select('name email');
    const userName = user?.name || 'Unknown User';
    const userEmail = user?.email || '-';

    const subjectMap = {
      NEW_ORDER: '🆕 New Order Placed',
      ORDER_CANCELLED: '❌ Order Cancelled',
      ORDER_RETURNED: '↩️ Order Returned',
      ORDER_REFUNDED: '💸 Order Refunded'
    };

    const subject = subjectMap[type] || 'Order Update';

    const notifications = admins.map(a => ({
      adminId: a._id,
      userId: order.userId,
      userName,
      orderId: order._id,
      type,
      message: `${subject} - ${order.orderNumber}`,
      metadata: { finalAmount: order.finalAmount, ...extra }
    }));

    await Notification.insertMany(notifications);

    // 🔥 Rich admin email
    const html = generateAdminOrderEmailHTML(order, userName, userEmail);

    // admins.forEach(a => {
    await   sendEmail(userEmail, subject, html)
    //     .catch(err => console.error('Admin email failed', err.message));
    // });

  } catch (err) {
    console.error('createAdminOrderNotifications error', err.message);
  }
}

module.exports = { createAdminOrderNotifications };
