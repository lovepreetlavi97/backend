const crypto = require("crypto");

exports.razorpayWebhookHandler = (req, res) => {
  console.log("🔔 Razorpay Webhook Received", req.body.toString());

  const body = req.body; // BUFFER

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  const receivedSignature = req.headers["x-razorpay-signature"];

  if (expectedSignature !== receivedSignature) {
    console.log("⚠️ Webhook Signature Verification Failed");
    return res.status(400).json({ error: "Invalid signature" });
  }

  console.log("✅ Webhook Verified Successfully");

  res.status(200).json({ status: "ok" });
};
