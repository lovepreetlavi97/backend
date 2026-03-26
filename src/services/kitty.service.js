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
    status: { $in: ["active", "paused", "pending"] },
  }).populate("planId");

  if (!userKitty) {
    console.log("❌ [markPaymentAsPaid] UserKitty NOT FOUND for paymentId:", paymentId);
    throw new Error("Kitty payment not found");
  }

  const payment = userKitty.payments.id(paymentId);
  if (!payment) {
    throw new Error("Kitty payment not found in array");
  }

  if (payment.status === "paid") {
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

  // Business Rule: Activate pending plan on first payment
  if (userKitty.status === 'pending') {
    userKitty.status = 'active';
    console.log("🎉 [markPaymentAsPaid] Kitty ACTIVATED");
  }

  // Count remaining pending/overdue payments
  const unpaidPayments = userKitty.payments.filter(
    (p) => p.status === "pending" || p.status === "overdue"
  );

  // Update totalPaid (for safety before save)
  const totalPaid = userKitty.payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  if (unpaidPayments.length === 0) {
    // All installments paid
    userKitty.status = "completed";
    userKitty.completedDate = new Date();
    userKitty.maturityPaidDate = new Date();
    userKitty.nextPaymentDate = null;
    console.log("🎉 [markPaymentAsPaid] Kitty COMPLETED (Full Schedule)");
  } else {
    // Set nextPaymentDate to the earliest unpaid installment's dueDate
    const nextPending = unpaidPayments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
    userKitty.nextPaymentDate = nextPending.dueDate;
  }

  await userKitty.save();
  
  try {
    await cacheUtils.clearPattern(`route_/kitty/my-kitties/${userKitty._id}*`);
    await cacheUtils.clearPattern(`user:${userKitty.userId}:kitties:*`);
  } catch (cacheErr) {}

  return userKitty;
}

module.exports = {
  markPaymentAsPaid,
};
