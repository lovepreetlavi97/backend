// ✅ Razorpay Webhook Handler

export const razorpayWebhookHandler = async (req, res) => {
  try {
    console.log("🔔 Razorpay Webhook Received",req.body.toString());
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // raw body buffer convert to string for signature check
    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(req.body.toString());
    const digest = shasum.digest("hex");

    const signature = req.headers["x-razorpay-signature"];

    if (digest !== signature) {
      console.warn("⚠️ Webhook Signature Verification Failed");
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    const event = JSON.parse(req.body.toString());

    // Here you handle according event type
    // sample event types:
    // payment.captured
    // order.paid
    // payment.failed
    // subscription.charged

    if (event.event === "payment.captured") {
      // update order in DB → mark paid
      // event.payload.payment.entity.order_id
      // event.payload.payment.entity.id

      // TODO: database update logic here
      console.log("💰 Payment Captured Webhook: ", event.payload.payment.entity.id);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Webhook Handler Error:", err);
    return res.status(500).json({ success: false, message: "Webhook internal error" });
  }
};
