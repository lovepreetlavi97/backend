function formatMoneyINR(amount) {
  const n = Number(amount || 0);
  return `₹${n.toFixed(2)}`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildOrderConfirmationEmail({ brandName, supportEmail, order, customerName }) {
  const productsHtml = (order.products || [])
    .map((p) => {
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #ececec;">
            <div style="font-weight:600;color:#111827;">${escapeHtml(p.name)}</div>
            <div style="font-size:12px;color:#6b7280;">Qty: ${escapeHtml(p.quantity)} • Price: ${formatMoneyINR(p.price)}</div>
          </td>
          <td align="right" style="padding:12px 0;border-bottom:1px solid #ececec;font-weight:600;color:#111827;">
            ${formatMoneyINR(p.subtotal)}
          </td>
        </tr>
      `;
    })
    .join('');

  const isCod = order.paymentMethod === 'COD';
  const paidNow = isCod ? order.advanceAmount : order.finalAmount;
  const dueOnDelivery = isCod ? order.pendingAmount : 0;

  const address = order.shippingAddress || {};

  return `
  <div style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:720px;margin:0 auto;padding:24px;">
      <div style="background:#ffffff;border:1px solid #e6eaf2;border-radius:14px;overflow:hidden;">
        <div style="padding:22px 24px;background:#111827;color:#ffffff;">
          <div style="font-size:18px;font-weight:700;">${escapeHtml(brandName)}</div>
          <div style="font-size:13px;opacity:0.9;margin-top:4px;">Order confirmation</div>
        </div>

        <div style="padding:24px;">
          <div style="font-size:14px;color:#111827;line-height:1.6;">
            <div style="font-size:16px;font-weight:700;margin-bottom:6px;">Thanks${customerName ? `, ${escapeHtml(customerName)}` : ''} — we’ve received your order.</div>
            <div style="color:#374151;">Order ID: <strong>${escapeHtml(order.orderNumber)}</strong></div>
            <div style="color:#374151;">Payment method: <strong>${escapeHtml(order.paymentMethod)}</strong></div>
          </div>

          <div style="height:16px;"></div>

          <div style="border:1px solid #ececec;border-radius:12px;padding:16px;">
            <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:10px;">Payment summary</div>
            <table width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;color:#374151;">
              <tr><td style="padding:6px 0;">Subtotal</td><td align="right">${formatMoneyINR(order.subtotal)}</td></tr>
              <tr><td style="padding:6px 0;">Shipping</td><td align="right">${formatMoneyINR(order.shippingCharge)}</td></tr>
              <tr><td style="padding:6px 0;">Tax</td><td align="right">${formatMoneyINR(order.taxAmount)}</td></tr>
              <tr><td style="padding:6px 0;">Discount</td><td align="right">-${formatMoneyINR(order.discountAmount)}</td></tr>
              <tr><td style="padding:8px 0;border-top:1px solid #ececec;font-weight:700;color:#111827;">Total</td><td align="right" style="padding:8px 0;border-top:1px solid #ececec;font-weight:700;color:#111827;">${formatMoneyINR(order.finalAmount)}</td></tr>
            </table>

            <div style="height:10px;"></div>
            <table width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;color:#374151;">
              <tr><td style="padding:6px 0;">Paid now</td><td align="right" style="font-weight:700;color:#111827;">${formatMoneyINR(paidNow)}</td></tr>
              ${isCod ? `<tr><td style="padding:6px 0;">Due on delivery</td><td align="right" style="font-weight:700;color:#111827;">${formatMoneyINR(dueOnDelivery)}</td></tr>` : ``}
              ${isCod ? `<tr><td colspan="2" style="padding-top:6px;color:#6b7280;font-size:12px;">For Cash on Delivery orders, we collect a 10% advance payment now. The remaining amount will be collected at delivery.</td></tr>` : ``}
            </table>
          </div>

          <div style="height:16px;"></div>

          <div style="border:1px solid #ececec;border-radius:12px;padding:16px;">
            <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:10px;">Items</div>
            <table width="100%" cellspacing="0" cellpadding="0" style="font-size:13px;">
              ${productsHtml}
            </table>
          </div>

          <div style="height:16px;"></div>

          <div style="border:1px solid #ececec;border-radius:12px;padding:16px;">
            <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:10px;">Delivery address</div>
            <div style="font-size:13px;color:#374151;line-height:1.55;">
              <div style="font-weight:700;color:#111827;">${escapeHtml(address.contactName || '')}</div>
              <div>${escapeHtml(address.addressLine1 || '')}${address.addressLine2 ? `, ${escapeHtml(address.addressLine2)}` : ''}</div>
              <div>${escapeHtml(address.city || '')}, ${escapeHtml(address.state || '')} ${escapeHtml(address.postalCode || '')}</div>
              <div>${escapeHtml(address.country || '')}</div>
              <div style="margin-top:6px;">Phone: ${escapeHtml(address.contactPhone || '')}</div>
            </div>
          </div>

          <div style="height:18px;"></div>

          <div style="font-size:12px;color:#6b7280;line-height:1.6;">
            Need help? Reply to this email${supportEmail ? ` or contact us at <a href="mailto:${escapeHtml(supportEmail)}" style="color:#111827;">${escapeHtml(supportEmail)}</a>` : ''}.
          </div>
        </div>
      </div>

      <div style="text-align:center;font-size:11px;color:#9ca3af;margin-top:14px;">
        This is an automated message. Please do not share payment OTPs or passwords with anyone.
      </div>
    </div>
  </div>
  `;
}

module.exports = { buildOrderConfirmationEmail };

