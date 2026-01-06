import crypto from "crypto";
import Razorpay from "razorpay";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { createAdminOrderNotifications } 
  from '../services/notifications/notification.service.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const razorpayWebhookHandler = async (req, res) => {
  try {
    console.log("🔔 Razorpay Webhook Received");

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // ---- SIGNATURE CHECK ----
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    const receivedSignature = req.headers["x-razorpay-signature"];

    if (expectedSignature !== receivedSignature) {
      console.log("❌ Invalid signature!");
      return res.status(400).json({ error: "Invalid signature" });
    }

    console.log("✅ Signature verified");

    // ---- PARSE WEBHOOK ----
    const data = JSON.parse(req.body.toString());
    const event = data.event;

    const payment = data?.payload?.payment?.entity;
    if (!payment) {
      console.log("⚠️ No payment entity found");
      return res.json({ status: "ignored" });
    }

    const razorpayPaymentId = payment.id;
    const razorpayOrderId = payment.order_id;
    const amountPaid = payment.amount / 100;

    // Extract your internal order ID from notes
    const internalOrderId = payment.notes?.orderId;

    if (!internalOrderId) {
      console.log("⚠️ No orderId in Razorpay notes");
      return res.json({ status: "no_internal_order" });
    }

    const order = await Order.findById(internalOrderId);

    if (!order) {
      console.log("❌ Order not found in DB");
      return res.json({ status: "order_not_found" });
    }

    // -----------------------------
    // 1️⃣ PAYMENT AUTHORIZED
    // -----------------------------
    if (event === "payment.authorized" && payment.status === "authorized") {
      console.log("💰 Payment Authorized. Capturing now...");

      try {
        const capture = await razorpay.payments.capture(
          razorpayPaymentId,
          payment.amount,
          "INR"
        );

        console.log("💳 Payment Captured:", capture);

        order.paymentStatus = "CAPTURE_INITIATED";
        await order.save();

        return res.json({ status: "capturing_payment" });
      } catch (e) {
        console.log("❌ Capture failed:", e.message);
        return res.json({ status: "capture_failed" });
      }
    }

    // -----------------------------
    // 2️⃣ PAYMENT CAPTURED
    // -----------------------------
 // -----------------------------
// 2️⃣ PAYMENT CAPTURED
// -----------------------------
if (event === "payment.captured" && payment.status === "captured") {
  console.log("🎉 Payment Captured Successfully!");

  // 🛑 Prevent duplicate processing
  if (order.paymentStatus === "Paid") {
    console.log("⚠️ Order already processed. Skipping email.");
    return res.json({ status: "already_processed" });
  }

  order.status = "Confirmed";
  order.paymentStatus = "Paid";
  order.razorpayPaymentId = razorpayPaymentId;

  await order.save();

  // -----------------------------
  // 3️⃣ UPDATE STOCK
  // -----------------------------

  console.log("🧾 Order keys:", Object.keys(order.toObject()));
console.log("🧾 order.items:", order.items);
console.log("🧾 order.products:", order.products);

  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: {
        stock: -item.quantity,
        purchaseCount: item.quantity,
      },
    });
  }

  console.log("📦 Order Confirmed & Stock Updated");

  // -----------------------------
  // 4️⃣ ADMIN EMAIL + NOTIFICATION
  // -----------------------------
  createAdminOrderNotifications('NEW_ORDER', order)
    .catch(e => console.error('NEW_ORDER notification error:', e));

  return res.json({ status: "order_confirmed" });
}


    return res.json({ status: "ignored_event" });

  } catch (err) {
    console.error("❌ Webhook Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
