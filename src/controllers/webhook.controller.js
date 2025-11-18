import crypto from "crypto";

export const razorpayWebhookHandler = (req, res) => {
  try {
    console.log("🔔 Razorpay Webhook Received", req.body.toString());

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body) // MUST be raw Buffer
      .digest("hex");

    const receivedSignature = req.headers["x-razorpay-signature"];

    if (expectedSignature !== receivedSignature) {
      console.log("⚠️ Signature mismatch");
      return res.status(400).json({ error: "Invalid signature" });
    }

    console.log("✅ Signature verified!");

    const jsonData = JSON.parse(req.body.toString());
    console.log("📦 Parsed Data:", jsonData);

    res.json({ status: "ok" });

  } catch (err) {
    console.error("❌ Webhook error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
