const Razorpay = require("razorpay");
const crypto = require("crypto");

// initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🧾 Create Razorpay Order
async function createRazorpayOrder(req, res) {
  try {
    let { amount, currency = "INR", receipt, orderId } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({ success: false, message: "Amount and orderId required" });
    }

    amount = Number(amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    // short, unique, < 40 chars
    const safeReceipt = receipt || `ORD-${String(orderId).slice(-6)}-${Date.now().toString().slice(-6)}`;

    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: safeReceipt,
      notes: {
        orderId,
      },
    };

    const order = await razorpay.orders.create(options);

    return res.json({ success: true, order });
  } catch (err) {
    console.error("🔴 Razorpay Create Error:", err?.error || err);
    return res.status(500).json({
      success: false,
      message: err?.error?.description || err.message || "Payment order failed",
    });
  }
}

// ✅ Verify Razorpay Payment Signature
async function verifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Missing payment fields" });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      return res.json({ success: true, message: "Payment verified successfully" });
    }

    return res.status(400).json({ success: false, message: "Invalid signature" });
  } catch (err) {
    console.error("Error verifying Razorpay payment:", err);
    return res.status(500).json({ success: false, message: "Server error during verification" });
  }
}

module.exports = { createRazorpayOrder, verifyPayment };
