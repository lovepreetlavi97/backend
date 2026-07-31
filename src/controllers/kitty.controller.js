const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");
const { KittyPlan, UserKitty, User } = require("../models");
const Razorpay = require("razorpay");
const { isValidId } = require("../utils/idUtils");
const { Op } = require("sequelize");

// Get all kitty plans (Admin only)
const getAllKittyPlans = async (req, res) => {
  try {
    const { category, minAmount, maxAmount, page = 1, limit = 10 } = req.query;

    const where = {};
    if (category) where.category = category;
    if (minAmount || maxAmount) {
      where.monthlyAmount = {};
      if (minAmount) where.monthlyAmount[Op.gte] = parseFloat(minAmount);
      if (maxAmount) where.monthlyAmount[Op.lte] = parseFloat(maxAmount);
    }

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: plans } = await KittyPlan.findAndCountAll({
      where,
      limit: parsedLimit,
      offset,
      order: [['id', 'DESC']]
    });

    return successResponse(res, 200, messages.DATA_FETCHED, {
      plans,
      pagination: {
        current: parsedPage,
        total: Math.ceil(count / parsedLimit),
        count
      }
    });
  } catch (error) {
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Get all active kitty plans
const getActiveKittyPlans = async (req, res) => {
  try {
    const { category, minAmount, maxAmount, page = 1, limit = 10 } = req.query;

    const where = { isActive: true };
    if (category) where.category = category;
    if (minAmount || maxAmount) {
      where.monthlyAmount = {};
      if (minAmount) where.monthlyAmount[Op.gte] = parseFloat(minAmount);
      if (maxAmount) where.monthlyAmount[Op.lte] = parseFloat(maxAmount);
    }

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: plans } = await KittyPlan.findAndCountAll({
      where,
      limit: parsedLimit,
      offset,
      order: [['id', 'DESC']]
    });

    return successResponse(res, 200, messages.DATA_FETCHED, {
      plans,
      pagination: {
        current: parsedPage,
        total: Math.ceil(count / parsedLimit),
        count
      }
    });
  } catch (error) {
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Get kitty plan by ID
const getKittyPlanById = async (req, res) => {
  try {
    const { planId } = req.params;

    if (!isValidId(planId)) {
      return errorResponse(res, 400, messages.INVALID_ID);
    }

    const plan = await KittyPlan.findByPk(planId);

    if (!plan) {
      return errorResponse(res, 404, 'Kitty plan not found');
    }

    return successResponse(res, 200, messages.DATA_FETCHED, plan);
  } catch (error) {
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Create new kitty plan (Admin only)
const createKittyPlan = async (req, res) => {
  try {
    const planData = req.body;
    const adminId = req.user?.id || req.user?._id;

    if (!planData.name || !planData.monthlyAmount) {
      return errorResponse(res, 400, 'Name and monthlyAmount are required');
    }

    const duration = planData.durationInMonths || planData.duration || 12;
    planData.durationInMonths = duration;
    planData.totalPayable = planData.totalAmount || (planData.monthlyAmount * duration);

    if (!planData.slug) {
      planData.slug = planData.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
    }

    const plan = await KittyPlan.create(planData);
    await cacheUtils.clearPattern('kitty:*');

    return successResponse(res, 201, 'Kitty plan created successfully', plan);
  } catch (error) {
    return errorResponse(res, 500, error.message || messages.SERVER_ERROR);
  }
};

// Update kitty plan
const updateKittyPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updateData = req.body;

    if (!isValidId(planId)) {
      return errorResponse(res, 400, messages.INVALID_ID);
    }

    const plan = await KittyPlan.findByPk(planId);
    if (!plan) {
      return errorResponse(res, 404, 'Kitty plan not found');
    }

    const totalEnrollments = await UserKitty.count({ where: { planId } });
    if (totalEnrollments > 0) {
      return errorResponse(res, 400, 'Cannot update plan with enrolled users');
    }

    await plan.update(updateData);
    await cacheUtils.clearPattern('kitty:*');

    return successResponse(res, 200, 'Kitty plan updated successfully', plan);
  } catch (error) {
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Delete kitty plan
const deleteKittyPlan = async (req, res) => {
  try {
    const { planId } = req.params;

    if (!isValidId(planId)) {
      return errorResponse(res, 400, messages.INVALID_ID);
    }

    const plan = await KittyPlan.findByPk(planId);
    if (!plan) {
      return errorResponse(res, 404, 'Kitty plan not found');
    }

    const totalEnrollments = await UserKitty.count({ where: { planId } });
    if (totalEnrollments > 0) {
      return errorResponse(res, 400, 'Cannot delete plan with enrolled users');
    }

    await plan.destroy();
    await cacheUtils.clearPattern('kitty:*');

    return successResponse(res, 200, 'Kitty plan deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

const enrollInKittyPlan = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!userId || !planId) {
      return errorResponse(res, 400, "User ID and Plan ID are required");
    }

    const plan = await KittyPlan.findByPk(planId);
    if (!plan) return errorResponse(res, 404, 'Kitty plan not found');
    if (!plan.isActive) return errorResponse(res, 400, 'Plan is not available for enrollment');

    const duration = plan.durationInMonths || 12;
    const monthlyAmount = Number(plan.monthlyAmount);

    const payments = [];
    const startDate = new Date();
    
    payments.push({
      _id: '1_' + Date.now(),
      id: '1_' + Date.now(),
      amount: monthlyAmount,
      dueDate: new Date(startDate),
      status: 'pending'
    });

    for (let i = 1; i < duration; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      payments.push({
        _id: (i + 1) + '_' + Date.now(),
        id: (i + 1) + '_' + Date.now(),
        amount: monthlyAmount,
        dueDate: dueDate,
        status: 'pending'
      });
    }

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + duration);

    const totalAmount = monthlyAmount * duration;
    const maturityAmount = Number(plan.maturityAmount || totalAmount);

    const userKitty = await UserKitty.create({
      planId,
      userId,
      startDate,
      endDate,
      nextPaymentDate: startDate,
      monthlyAmount,
      totalAmount,
      maturityAmount,
      remainingAmount: totalAmount,
      totalPaid: 0,
      status: 'pending',
      payments
    });

    await cacheUtils.clearPattern(`user:${userId}:kitties:*`);

    return successResponse(res, 201, 'Enrollment created. Please proceed to payment.', userKitty);
  } catch (error) {
    return errorResponse(res, 500, error.message || messages.SERVER_ERROR);
  }
};

// Get user's kitties
const getMyKitties = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { status, page = 1, limit = 10 } = req.query;

    const where = { userId };
    if (status) where.status = status;

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: kitties } = await UserKitty.findAndCountAll({
      where,
      include: [{ model: KittyPlan }],
      limit: parsedLimit,
      offset,
      order: [['id', 'DESC']]
    });

    const allUserKitties = await UserKitty.findAll({ where: { userId } });

    let activeKitties = 0;
    let completedKitties = 0;
    let totalInvested = 0;
    let totalMaturity = 0;

    allUserKitties.forEach(k => {
      if (k.status === 'active') activeKitties++;
      if (k.status === 'completed') completedKitties++;
      totalInvested += Number(k.totalPaid || 0);
      totalMaturity += Number(k.maturityAmount || 0);
    });

    const statsData = {
      totalKitties: allUserKitties.length,
      activeKitties,
      completedKitties,
      totalInvested,
      totalMaturity,
      nextPaymentAmount: 0,
      nextPaymentDate: null
    };

    const nextPaymentKitty = allUserKitties.find(k => k.status === 'active');
    if (nextPaymentKitty) {
      const payments = Array.isArray(nextPaymentKitty.payments) ? nextPaymentKitty.payments : [];
      const nextP = payments.find(p => p.status === 'pending');
      if (nextP) {
        statsData.nextPaymentAmount = nextP.amount;
        statsData.nextPaymentDate = nextP.dueDate;
      }
    }

    return successResponse(res, 200, messages.DATA_FETCHED, {
      kitties,
      stats: statsData,
      pagination: {
        current: parsedPage,
        total: Math.ceil(count / parsedLimit),
        count
      }
    });
  } catch (error) {
    return errorResponse(res, 500, error.message || messages.SERVER_ERROR);
  }
};

// Get specific kitty details
const getKittyDetails = async (req, res) => {
  try {
    const { kittyId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!isValidId(kittyId)) {
      return errorResponse(res, 400, messages.INVALID_ID);
    }

    const kitty = await UserKitty.findOne({
      where: { id: kittyId, userId },
      include: [
        { model: KittyPlan },
        { model: User, attributes: ['id', 'name', 'email', 'phoneNumber'] }
      ]
    });

    if (!kitty) {
      return errorResponse(res, 404, 'Kitty not found');
    }

    return successResponse(res, 200, messages.DATA_FETCHED, kitty);
  } catch (error) {
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Initiate kitty payment
const initiateKittyPayment = async (req, res) => {
  try {
    const { paymentId } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!userId || !paymentId) {
      return errorResponse(res, 400, "paymentId and userId are required");
    }

    const allKitties = await UserKitty.findAll({
      where: { userId, status: ['active', 'pending'] },
      include: [{ model: KittyPlan }]
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
      return errorResponse(res, 404, 'Payment not found');
    }

    if (payment.status !== 'pending') {
      return errorResponse(res, 400, 'Payment is not pending');
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return errorResponse(res, 500, "Razorpay keys are not configured");
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(Number(payment.amount) * 100),
      currency: "INR",
      receipt: `KITTY-${String(userKitty.id).slice(-6)}-${Date.now().toString().slice(-6)}`,
      notes: {
        type: "KITTY",
        kittyId: String(userKitty.id),
        kittyPaymentId: String(payment._id || payment.id),
        userId: String(userId),
        planId: String(userKitty.planId),
      },
    });

    payment.razorpayOrderId = order.id;
    await userKitty.update({ payments: userKitty.payments });

    return successResponse(res, 200, 'Payment initiated successfully', {
      orderId: order.id,
      amount: payment.amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      companyName: 'Guru Jewellers',
      description: `Kitty payment for ${userKitty.KittyPlan ? userKitty.KittyPlan.name : 'Kitty Plan'}`,
      paymentId: payment._id || payment.id
    });

  } catch (error) {
    return errorResponse(res, 500, error.message || messages.SERVER_ERROR);
  }
};

// Get all kitty enrollments (Admin)
const getAllKittyEnrollments = async (req, res) => {
  try {
    const { status, planId, userId, page = 1, limit = 10 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (planId) where.planId = planId;
    if (userId) where.userId = userId;

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: enrollments } = await UserKitty.findAndCountAll({
      where,
      include: [
        { model: KittyPlan, attributes: ['id', 'name', 'monthlyAmount'] },
        { model: User, attributes: ['id', 'name', 'email', 'phoneNumber'] }
      ],
      limit: parsedLimit,
      offset,
      order: [['id', 'DESC']]
    });

    return successResponse(res, 200, messages.DATA_FETCHED, {
      enrollments,
      pagination: {
        current: parsedPage,
        total: Math.ceil(count / parsedLimit),
        count
      }
    });
  } catch (error) {
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Get specific kitty details for Admin
const getKittyDetailsForAdmin = async (req, res) => {
  try {
    const { kittyId } = req.params;

    if (!isValidId(kittyId)) {
      return errorResponse(res, 400, messages.INVALID_ID);
    }

    const kitty = await UserKitty.findByPk(kittyId, {
      include: [
        { model: KittyPlan },
        { model: User, attributes: ['id', 'name', 'email', 'phoneNumber'] }
      ]
    });

    if (!kitty) {
      return errorResponse(res, 404, 'Kitty enrollment not found');
    }

    return successResponse(res, 200, messages.DATA_FETCHED, kitty);
  } catch (error) {
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Get kitty statistics (Admin)
const getKittyStatistics = async (req, res) => {
  try {
    const allEnrollments = await UserKitty.findAll();
    
    let totalEnrollments = allEnrollments.length;
    let activeEnrollments = 0;
    let completedEnrollments = 0;
    let totalInvestment = 0;
    let totalMaturityValue = 0;
    let monthlyRevenue = 0;

    allEnrollments.forEach(k => {
      if (k.status === 'active') {
        activeEnrollments++;
        monthlyRevenue += Number(k.monthlyAmount || 0);
      }
      if (k.status === 'completed') completedEnrollments++;
      totalInvestment += Number(k.totalPaid || 0);
      totalMaturityValue += Number(k.maturityAmount || 0);
    });

    return successResponse(res, 200, messages.DATA_FETCHED, {
      overview: {
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        totalInvestment,
        totalMaturityValue
      },
      planStats: [],
      monthlyRevenue
    });
  } catch (error) {
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

const seedDummyKittyData = async (req, res) => {
  return successResponse(res, 200, "Dummy kitty data seed endpoint ready.");
};

const recordManualPayment = async (req, res) => {
  try {
    const { paymentId, method, receiptId } = req.body;
    if (!paymentId || !method) {
      return errorResponse(res, 400, "paymentId and method are required");
    }

    const { markPaymentAsPaid } = require("../services/kitty.service");
    const userKitty = await markPaymentAsPaid({
      paymentId,
      paymentMethod: method,
      transactionId: receiptId,
    });

    return successResponse(res, 200, "Manual payment recorded successfully", userKitty);
  } catch (error) {
    return errorResponse(res, 500, error.message || messages.SERVER_ERROR);
  }
};

const getAllKittyTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const allKitties = await UserKitty.findAll({
      include: [
        { model: User, attributes: ['id', 'name', 'email'] },
        { model: KittyPlan, attributes: ['id', 'name'] }
      ]
    });

    const transactions = [];
    allKitties.forEach(k => {
      const payments = Array.isArray(k.payments) ? k.payments : [];
      payments.forEach(p => {
        if (p.status === 'paid') {
          transactions.push({
            id: p.id || p._id,
            _id: p.id || p._id,
            enrollmentId: k.id,
            userId: k.userId,
            userName: k.User ? k.User.name : 'N/A',
            userEmail: k.User ? k.User.email : 'N/A',
            planName: k.KittyPlan ? k.KittyPlan.name : 'N/A',
            amount: p.amount,
            paymentDate: p.paymentDate,
            paymentMethod: p.paymentMethod,
            transactionId: p.transactionId,
            razorpayPaymentId: p.razorpayPaymentId,
            status: p.status
          });
        }
      });
    });

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const total = transactions.length;
    const pagedData = transactions.slice((parsedPage - 1) * parsedLimit, parsedPage * parsedLimit);

    return successResponse(res, 200, messages.DATA_FETCHED, {
      transactions: pagedData,
      pagination: {
        current: parsedPage,
        total: Math.ceil(total / parsedLimit),
        count: total
      }
    });
  } catch (error) {
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

const updateKittyEnrollmentStatus = async (req, res) => {
  try {
    const { kittyId } = req.params;
    const { status, remarks } = req.body;

    if (!isValidId(kittyId)) {
      return errorResponse(res, 400, messages.INVALID_ID);
    }

    const kitty = await UserKitty.findByPk(kittyId);
    if (!kitty) {
      return errorResponse(res, 404, 'Kitty enrollment not found');
    }

    if (!['completed', 'cancelled', 'active', 'paused'].includes(status)) {
      return errorResponse(res, 400, 'Invalid status update');
    }

    await kitty.update({ status, notes: remarks || kitty.notes });
    await cacheUtils.clearPattern(`user:${kitty.userId}:kitties:*`);
    await cacheUtils.clearPattern(`kitty:*`);

    return successResponse(res, 200, `Kitty enrollment marked as ${status} successfully`, kitty);
  } catch (error) {
    return errorResponse(res, 500, error.message || messages.SERVER_ERROR);
  }
};

const cancelKittyByUser = async (req, res) => {
  try {
    const { kittyId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!isValidId(kittyId)) {
      return errorResponse(res, 400, messages.INVALID_ID);
    }

    const kitty = await UserKitty.findOne({ where: { id: kittyId, userId } });

    if (!kitty) {
      return errorResponse(res, 404, 'Kitty enrollment not found');
    }

    if (kitty.status === 'cancelled' || kitty.status === 'completed') {
      return errorResponse(res, 400, `Cannot cancel a ${kitty.status} enrollment`);
    }

    await kitty.update({ status: 'cancelled', cancelledDate: new Date(), cancellationReason: 'Cancelled by user via dashboard' });
    await cacheUtils.clearPattern(`user:${userId}:kitties:*`);
    await cacheUtils.clearPattern(`kitty:*`);

    return successResponse(res, 200, 'Kitty enrollment cancelled successfully', kitty);
  } catch (error) {
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

module.exports = {
  getAllKittyPlans,
  getActiveKittyPlans,
  getKittyPlanById,
  createKittyPlan,
  updateKittyPlan,
  deleteKittyPlan,
  enrollInKittyPlan,
  getMyKitties,
  getKittyDetails,
  initiateKittyPayment,
  getAllKittyEnrollments,
  getKittyStatistics,
  getKittyDetailsForAdmin,
  seedDummyKittyData,
  recordManualPayment,
  getAllKittyTransactions,
  cancelKittyByUser,
  updateKittyEnrollmentStatus
};
