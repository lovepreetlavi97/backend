// ✅ Razorpay Webhook Handler

export const razorpayWebhookHandler = async (req, res) => {
  try {
    console.log("oooooooooooooooooooooooooooo");
    console.log("🔔 Razorpay Webhook Received", req.body.toString());

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const shasum = crypto.createHmac("sha256", webhookSecret);
    shasum.update(req.body.toString());
    const digest = shasum.digest("hex");

    const signature = req.headers["x-razorpay-signature"];

    if (digest !== signature) {
      console.warn("⚠️ Webhook Signature Verification Failed");
      return res.status(400).json({ success: false });
    }

    const event = JSON.parse(req.body.toString());
    console.log("Webhook Event:", event);

    return res.json({ success: true });
  } catch (err) {
    console.error("Webhook Handler Error:", err);
    return res.status(500).json({ success: false });
  }
};
