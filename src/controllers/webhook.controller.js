const crypto = require("crypto");
const Razorpay = require("razorpay");
const { Order, Product, User } = require("../models/index");
const { findOne, findAndUpdate } = require("../services/mysql/mysqlService");
const { createAdminOrderNotifications } = require("../services/notifications/notification.service");
const { sendEmail } = require("../services/notifications/email.service");
const { buildOrderConfirmationEmail } = require("../services/notifications/orderConfirmationTemplate");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function razorpayWebhookHandler(req, res) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // ---- SIGNATURE CHECK ----
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    const receivedSignature = req.headers["x-razorpay-signature"];

    if (expectedSignature !== receivedSignature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // ---- PARSE WEBHOOK ----
    const data = JSON.parse(req.body.toString());
    const event = data.event;

    const payment = data?.payload?.payment?.entity;
    if (!payment) {
      return res.json({ status: "ignored" });
    }

    const razorpayPaymentId = payment.id;
    const razorpayOrderId = payment.order_id;
    const amountPaid = payment.amount / 100;

    // Webhook Idempotency check using Redis cache
    const { cacheUtils } = require("../config/redis");
    if (razorpayPaymentId) {
      const isProcessed = await cacheUtils.get(`processed_webhook_${razorpayPaymentId}`);
      if (isProcessed) {
        return res.status(200).json({ status: "already_processed" });
      }
    }

    // Extract internal order ID from notes or receipt fallback
    const internalOrderId = payment.notes?.orderId || (payment.receipt ? payment.receipt.replace('order_', '') : null);

    if (!internalOrderId) {
      return res.json({ status: "no_internal_order" });
    }

    const order = await findOne(Order, { id: internalOrderId });

    if (!order) {
      return res.json({ status: "order_not_found" });
    }

    // -----------------------------
    // 1️⃣ PAYMENT AUTHORIZED
    // -----------------------------
    if (event === "payment.authorized" && payment.status === "authorized") {
      try {
        const capture = await razorpay.payments.capture(
          razorpayPaymentId,
          payment.amount,
          "INR"
        );
        return res.json({ status: "capturing_payment" });
      } catch (e) {
        return res.json({ status: "capture_failed" });
      }
    }

    // -----------------------------
    // 2️⃣ PAYMENT CAPTURED
    // -----------------------------
    if (event === "payment.captured" && payment.status === "captured") {
      if (order && String(order.paymentStatus).toLowerCase() === "paid") {
        if (razorpayPaymentId) {
          await cacheUtils.set(`processed_webhook_${razorpayPaymentId}`, true, 86400);
        }
        return res.json({ status: "already_processed" });
      }

      const updatedOrder = await findAndUpdate(
        Order,
        { id: internalOrderId },
        {
          orderStatus: "processing",
          paymentStatus: "paid",
          razorpayPaymentId: razorpayPaymentId,
          razorpayOrderId: razorpayOrderId,
        }
      );

      if (razorpayPaymentId) {
        await cacheUtils.set(`processed_webhook_${razorpayPaymentId}`, true, 86400);
      }

      if (!updatedOrder) {
        return res.json({ status: "already_processed" });
      }

      // -----------------------------
      // 3️⃣ UPDATE PURCHASE COUNT
      // -----------------------------
      if (updatedOrder.products && Array.isArray(updatedOrder.products)) {
        for (const item of updatedOrder.products) {
          const product = await findOne(Product, { id: item.productId });
          if (product) {
            await findAndUpdate(Product, { id: item.productId }, {
              purchaseCount: (product.purchaseCount || 0) + (item.quantity || 1)
            });
          }
        }
      }

      // -----------------------------
      // 4️⃣ CUSTOMER EMAIL + ADMIN NOTIFICATION
      // -----------------------------
      try {
        let customerEmail = updatedOrder.guestEmail;
        let customerName = updatedOrder.shippingAddress?.contactName || "";

        if (!customerEmail && updatedOrder.userId) {
          const u = await findOne(User, { id: updatedOrder.userId });
          customerEmail = u?.email || customerEmail;
          customerName = u?.name || customerName;
        }

        if (customerEmail) {
          const brandName = process.env.BRAND_NAME || "Guru Jewellers";
          const supportEmail = process.env.SUPPORT_EMAIL || process.env.MAIL_USER;
          const html = buildOrderConfirmationEmail({
            brandName,
            supportEmail,
            order: updatedOrder,
            customerName,
          });
          const subject = `Order confirmed • ${updatedOrder.orderNumber}`;
          await sendEmail(customerEmail, subject, html);
        }
      } catch (e) {
        console.error("Email send error:", e);
      }

      createAdminOrderNotifications('NEW_ORDER', updatedOrder)
        .catch(e => console.error('NEW_ORDER notification error:', e));

      return res.json({ status: "order_confirmed" });
    }

    return res.json({ status: "ignored_event" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { razorpayWebhookHandler };
