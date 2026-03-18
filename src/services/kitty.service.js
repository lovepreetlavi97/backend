const mongoose = require("mongoose");
const { UserKitty } = require("../models");

async function markPaymentAsPaid({
  paymentId,
  razorpayPaymentId,
  razorpayOrderId,
  razorpaySignature,
  paymentMethod = "razorpay",
}) {
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    throw new Error("Invalid paymentId");
  }

  const userKitty = await UserKitty.findOne({
    "payments._id": paymentId,
    status: { $in: ["active", "paused"] },
  }).populate("planId");

  if (!userKitty) {
    throw new Error("Kitty payment not found");
  }

  const payment = userKitty.payments.id(paymentId);
  if (!payment) {
    throw new Error("Kitty payment not found");
  }

  if (payment.status === "paid") {
    return userKitty;
  }

  if (payment.status !== "pending" && payment.status !== "overdue") {
    throw new Error("Payment is not payable");
  }

  payment.status = "paid";
  payment.paymentDate = new Date();
  payment.paymentMethod = paymentMethod;
  if (razorpayPaymentId) payment.razorpayPaymentId = razorpayPaymentId;
  if (razorpayOrderId) payment.razorpayOrderId = razorpayOrderId;
  if (razorpaySignature) payment.razorpaySignature = razorpaySignature;

  // If there is no next pending payment and kitty isn't completed/cancelled, generate next installment.
  const pendingCount = userKitty.payments.filter(
    (p) => p.status === "pending" || p.status === "overdue",
  ).length;

  if (pendingCount === 0 && userKitty.status === "active") {
    // Determine if kitty is completed (totalPaid >= totalAmount OR endDate reached).
    const willComplete =
      userKitty.totalPaid + payment.amount >= userKitty.totalAmount ||
      new Date() >= new Date(userKitty.endDate);

    if (willComplete) {
      userKitty.status = "completed";
      userKitty.completedDate = new Date();
      userKitty.maturityPaidDate = new Date();
    } else {
      const next = userKitty.generateNextPayment();
      if (next) {
        userKitty.payments.push(next);
        userKitty.nextPaymentDate = next.dueDate;
      }
    }
  }

  await userKitty.save();
  return userKitty;
}

module.exports = {
  markPaymentAsPaid,
};

