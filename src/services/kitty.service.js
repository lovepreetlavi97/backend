const { UserKitty, User, KittyPlan } = require("../models");
const { cacheUtils } = require("../config/redis");

async function markPaymentAsPaid({
  paymentId,
  razorpayPaymentId,
  razorpayOrderId,
  razorpaySignature,
  paymentMethod = "razorpay",
  transactionId,
}) {
  if (!paymentId) {
    throw new Error("Invalid paymentId");
  }

  // Find all active/paused/pending user kitties
  const allKitties = await UserKitty.findAll({
    where: {
      status: ["active", "paused", "pending"]
    },
    include: [
      { model: KittyPlan },
      { model: User, attributes: ['id', 'name', 'email'] }
    ]
  });

  let userKitty = null;
  let payment = null;

  for (const uk of allKitties) {
    const payments = Array.isArray(uk.payments) ? uk.payments : [];
    const p = payments.find(pay => String(pay._id || pay.id) === String(paymentId));
    if (p) {
      userKitty = uk;
      payment = p;
      break;
    }
  }

  if (!userKitty || !payment) {
    throw new Error("Kitty payment not found");
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
  if (transactionId) payment.transactionId = transactionId;

  // Activate pending plan on first payment
  let currentStatus = userKitty.status;
  if (currentStatus === 'pending') {
    currentStatus = 'active';
  }

  const paymentsArray = userKitty.payments || [];
  const unpaidPayments = paymentsArray.filter(
    (p) => p.status === "pending" || p.status === "overdue"
  );

  const totalPaid = paymentsArray
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  let completedDate = userKitty.completedDate;
  let maturityPaidDate = userKitty.maturityPaidDate;
  let nextPaymentDate = userKitty.nextPaymentDate;

  if (unpaidPayments.length === 0) {
    currentStatus = "completed";
    completedDate = new Date();
    maturityPaidDate = new Date();
    nextPaymentDate = null;
  } else {
    const nextPending = unpaidPayments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
    nextPaymentDate = nextPending ? nextPending.dueDate : nextPaymentDate;
  }

  await userKitty.update({
    payments: paymentsArray,
    status: currentStatus,
    totalPaid: totalPaid,
    remainingAmount: Math.max(0, Number(userKitty.totalAmount || 0) - totalPaid),
    completedDate,
    maturityPaidDate,
    nextPaymentDate
  });

  try {
    const { sendEmail } = require("./notifications/email.service");
    const { getKittyPaymentSuccessTemplate, getKittyCompletionTemplate } = require("../utils/kittyEmailTemplates");

    const paymentIndex = paymentsArray.findIndex(p => String(p._id || p.id) === String(paymentId));
    const installmentNo = paymentIndex + 1;
    const nextPayment = paymentsArray.find(p => p.status === 'pending' || p.status === 'overdue');

    const emailHtml = getKittyPaymentSuccessTemplate({
      userName: userKitty.User ? userKitty.User.name : 'Valued Customer',
      planName: userKitty.KittyPlan ? userKitty.KittyPlan.name : 'Kitty Plan',
      amount: payment.amount,
      installmentNo,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      nextDueDate: nextPayment ? new Date(nextPayment.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null,
      totalPaid: totalPaid,
      totalAmount: userKitty.totalAmount
    });

    if (userKitty.User && userKitty.User.email) {
      await sendEmail(
        userKitty.User.email,
        `Payment Received: ${userKitty.KittyPlan ? userKitty.KittyPlan.name : 'Kitty Plan'} (Inst. #${installmentNo})`,
        emailHtml
      );
    }

    if (unpaidPayments.length === 0 && userKitty.User && userKitty.User.email) {
      const completionEmailHtml = getKittyCompletionTemplate({
        userName: userKitty.User.name || 'Valued Customer',
        planName: userKitty.KittyPlan ? userKitty.KittyPlan.name : 'Kitty Plan',
        totalPaid: totalPaid,
        totalAmount: userKitty.totalAmount,
        maturityAmount: userKitty.maturityAmount,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      });

      await sendEmail(
        userKitty.User.email,
        `Congratulations! Your Kitty Plan is Completed: ${userKitty.KittyPlan ? userKitty.KittyPlan.name : 'Kitty Plan'}`,
        completionEmailHtml
      );
    }
  } catch (emailErr) {}

  try {
    await cacheUtils.clearPattern(`route_/kitty/my-kitties/${userKitty.id}*`);
    await cacheUtils.clearPattern(`user:${userKitty.userId}:kitties:*`);
  } catch (cacheErr) {}

  return userKitty;
}

module.exports = {
  markPaymentAsPaid,
};
