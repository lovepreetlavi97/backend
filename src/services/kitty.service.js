const mongoose = require("mongoose");
const { UserKitty } = require("../models");
const { cacheUtils } = require("../config/redis");

async function markPaymentAsPaid({
  paymentId,
  razorpayPaymentId,
  razorpayOrderId,
  razorpaySignature,
  paymentMethod = "razorpay",
}) {
  console.log("💳 [markPaymentAsPaid] START — paymentId:", paymentId);

  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new Error("Invalid paymentId");
  }

  const userKitty = await UserKitty.findOne({
    "payments._id": paymentId,
    status: { $in: ["active", "paused"] },
  }).populate("planId");

  if (!userKitty) {
    console.log("❌ [markPaymentAsPaid] UserKitty NOT FOUND for paymentId:", paymentId);
    throw new Error("Kitty payment not found");
  }

  console.log("✅ [markPaymentAsPaid] Found userKitty:", userKitty._id, "| payments count:", userKitty.payments.length);

  const payment = userKitty.payments.id(paymentId);
  if (!payment) {
    console.log("❌ [markPaymentAsPaid] payment subdoc NOT FOUND");
    throw new Error("Kitty payment not found");
  }

  console.log("✅ [markPaymentAsPaid] payment:", payment._id, "| status:", payment.status, "| dueDate:", payment.dueDate);

  if (payment.status === "paid") {
    console.log("ℹ️ [markPaymentAsPaid] Already paid — returning early");
    return userKitty;
  }

  if (payment.status !== "pending" && payment.status !== "overdue") {
    throw new Error("Payment is not payable");
  }

  // Mark this payment as paid
  payment.status = "paid";
  payment.paymentDate = new Date();
  payment.paymentMethod = paymentMethod;
  if (razorpayPaymentId) payment.razorpayPaymentId = razorpayPaymentId;
  if (razorpayOrderId) payment.razorpayOrderId = razorpayOrderId;
  if (razorpaySignature) payment.razorpaySignature = razorpaySignature;

  // Count remaining pending/overdue payments AFTER marking this one paid
  const pendingCount = userKitty.payments.filter(
    (p) => p.status === "pending" || p.status === "overdue"
  ).length;

  console.log("📊 [markPaymentAsPaid] pendingCount after marking paid:", pendingCount, "| totalPaid so far:", userKitty.totalPaid, "| payment.amount:", payment.amount, "| totalAmount:", userKitty.totalAmount);

  if (pendingCount === 0 && userKitty.status === "active") {
    // NOTE: totalPaid hasn't been updated by pre-save hook yet, so we add payment.amount manually
    const projectedPaid = userKitty.totalPaid + payment.amount;
    const willComplete =
      projectedPaid >= userKitty.totalAmount ||
      new Date() >= new Date(userKitty.endDate);

    console.log("📊 [markPaymentAsPaid] projectedPaid:", projectedPaid, "| willComplete:", willComplete);

    if (willComplete) {
      userKitty.status = "completed";
      userKitty.completedDate = new Date();
      userKitty.maturityPaidDate = new Date();
      userKitty.nextPaymentDate = null;
      console.log("🎉 [markPaymentAsPaid] Kitty COMPLETED");
    } else {
      // Generate next installment using the last scheduled dueDate + 1 month
      const next = userKitty.generateNextPayment();
      console.log("📅 [markPaymentAsPaid] Generated next payment:", next);
      if (next) {
        userKitty.payments.push(next);
        userKitty.nextPaymentDate = next.dueDate;
        console.log("✅ [markPaymentAsPaid] nextPaymentDate set to:", next.dueDate);
      }
    }
  } else {
    console.log("ℹ️ [markPaymentAsPaid] pendingCount is", pendingCount, "— not generating new installment");
  }

  await userKitty.save();
  console.log("💾 [markPaymentAsPaid] Saved. nextPaymentDate in DB:", userKitty.nextPaymentDate);

  // Clear Redis cache (non-fatal if Redis is down)
  try {
    await cacheUtils.clearPattern(`route_/kitty/my-kitties/${userKitty._id}*`);
    await cacheUtils.clearPattern(`route_/kitty/my-kitties*`);
    await cacheUtils.clearPattern(`user:${userKitty.userId}:kitties:*`);
  } catch (cacheErr) {
    console.warn("⚠️ Failed to clear kitty cache (non-fatal):", cacheErr?.message);
  }

  return userKitty;
}

module.exports = {
  markPaymentAsPaid,
};
