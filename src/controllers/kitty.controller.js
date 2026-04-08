const {
  create,
  findOne,
  findMany,
  findAndUpdate,
  softDelete,
  aggregate,
} = require("../services/mongodb/mongoService");
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");
const { KittyPlan, UserKitty, User } = require("../models");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const ObjectId = mongoose.Types.ObjectId;

// Get all kitty plans (Admin only)
const getAllKittyPlans = async (req, res) => {
  try {
    const { category, minAmount, maxAmount, page = 1, limit = 10 } = req.query;

    // Build filter (no isActive filter for admin)
    const filter = {};
    if (category) filter.category = category;
    if (minAmount || maxAmount) {
      filter.monthlyAmount = {};
      if (minAmount) filter.monthlyAmount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.monthlyAmount.$lte = parseFloat(maxAmount);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const plans = await findMany(KittyPlan, filter, {}, {
      sort: { createdAt: -1 },
      skip,
      limit: parseInt(limit)
    }, 'createdBy');

    const total = await KittyPlan.countDocuments(filter);

    return successResponse(res, 200, messages.DATA_FETCHED, {
      plans,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total
      }
    });
  } catch (error) {
    console.error('Error fetching all kitty plans:', error);
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Get all active kitty plans
const getActiveKittyPlans = async (req, res) => {
  try {
    const { category, minAmount, maxAmount, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (minAmount || maxAmount) {
      filter.monthlyAmount = {};
      if (minAmount) filter.monthlyAmount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.monthlyAmount.$lte = parseFloat(maxAmount);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const plans = await findMany(KittyPlan, filter, {}, {
      sort: { createdAt: -1 },
      skip,
      limit: parseInt(limit)
    }, 'createdBy');

    const total = await KittyPlan.countDocuments(filter);

    return successResponse(res, 200, messages.DATA_FETCHED, {
      plans,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total
      }
    });
  } catch (error) {
    console.error('Error fetching kitty plans:', error);
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Get kitty plan by ID
const getKittyPlanById = async (req, res) => {
  try {
    const { planId } = req.params;

    if (!ObjectId.isValid(planId)) {
      return errorResponse(res, 400, messages.INVALID_ID);
    }

    const plan = await KittyPlan.findById(planId)
      .populate('createdBy', 'name email');

    if (!plan) {
      return errorResponse(res, 404, 'Kitty plan not found');
    }

    return successResponse(res, 200, messages.DATA_FETCHED, plan);
  } catch (error) {
    console.error('Error fetching kitty plan:', error);
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Create new kitty plan (Admin only)
const createKittyPlan = async (req, res) => {
  try {
    const planData = req.body;
    const adminId = req.user?._id;

    // Validate required fields
    const requiredFields = ['name', 'description', 'duration', 'monthlyAmount', 'totalAmount', 'maturityAmount', 'category'];
    for (const field of requiredFields) {
      if (!planData[field]) {
        return errorResponse(res, 400, `${field} is required`);
      }
    }

    // Calculate total amount if not provided
    if (!planData.totalAmount) {
      planData.totalAmount = planData.monthlyAmount * planData.duration;
    }

    // Set creator
    planData.createdBy = adminId;

    const plan = await create(KittyPlan, planData);

    // Clear cache
    await cacheUtils.clearPattern('kitty:*');

    return successResponse(res, 201, 'Kitty plan created successfully', plan);
  } catch (error) {
    console.error('Error creating kitty plan:', error);
    if (error.name === 'ValidationError') {
      return errorResponse(res, 400, error.message);
    }
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Update kitty plan (Admin only)
const updateKittyPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updateData = req.body;

    if (!ObjectId.isValid(planId)) {
      return errorResponse(res, 400, messages.INVALID_ID);
    }

    const plan = await KittyPlan.findById(planId);
    if (!plan) {
      return errorResponse(res, 404, 'Kitty plan not found');
    }

    // Check if there are ANY enrollments (as requested by user)
    const totalEnrollments = await UserKitty.countDocuments({ planId });
    if (totalEnrollments > 0) {
      return errorResponse(res, 400, 'Cannot update plan with enrolled users');
    }

    const updatedPlan = await KittyPlan.findByIdAndUpdate(
      planId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!plan) {
      return errorResponse(res, 404, 'Kitty plan not found');
    }

    // Clear cache
    await cacheUtils.clearPattern('kitty:*');

    return successResponse(res, 200, 'Kitty plan updated successfully', plan);
  } catch (error) {
    console.error('Error updating kitty plan:', error);
    if (error.name === 'ValidationError') {
      return errorResponse(res, 400, error.message);
    }
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Delete kitty plan (Admin only)
const deleteKittyPlan = async (req, res) => {
  try {
    const { planId } = req.params;

    if (!ObjectId.isValid(planId)) {
      return errorResponse(res, 400, messages.INVALID_ID);
    }

    const plan = await KittyPlan.findById(planId);
    if (!plan) {
      return errorResponse(res, 404, 'Kitty plan not found');
    }

    // Check if there are ANY enrollments (as requested by user)
    const totalEnrollments = await UserKitty.countDocuments({ planId });
    if (totalEnrollments > 0) {
      return errorResponse(res, 400, 'Cannot delete plan with enrolled users');
    }

    await KittyPlan.findByIdAndDelete(planId);

    // Clear cache
    await cacheUtils.clearPattern('kitty:*');

    return successResponse(res, 200, 'Kitty plan deleted successfully');
  } catch (error) {
    console.error('Error deleting kitty plan:', error);
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

const enrollInKittyPlan = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user?._id;

    if (!userId || !planId) {
      return errorResponse(res, 400, "User ID and Plan ID are required");
    }

    const plan = await KittyPlan.findById(planId);
    if (!plan) return errorResponse(res, 404, 'Kitty plan not found');
    if (!plan.isActive) return errorResponse(res, 400, 'Plan is not available for enrollment');

    // Business Rule: One active plan per category
    const userKitties = await UserKitty.find({
      userId,
      status: { $in: ['active', 'paused', 'pending'] }
    }).populate('planId');

    const hasSameCategory = userKitties.some(k => k.planId && k.planId.category === plan.category);
    if (hasSameCategory) {
      return errorResponse(res, 400, `You already have an active ${plan.category} plan. Complete or cancel it before enrolling again.`);
    }

    // Generate Full Installment Schedule
    const payments = [];
    const startDate = new Date();
    
    // First installment is due immediately (Day 0)
    payments.push({
      amount: plan.monthlyAmount,
      dueDate: new Date(startDate),
      status: 'pending'
    });

    // Subsequent installments
    for (let i = 1; i < plan.duration; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      payments.push({
        amount: plan.monthlyAmount,
        dueDate: dueDate,
        status: 'pending'
      });
    }

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.duration);

    const userKitty = await UserKitty.create({
      planId,
      userId,
      startDate,
      endDate,
      nextPaymentDate: startDate, // First payment is due now
      monthlyAmount: plan.monthlyAmount,
      totalAmount: plan.totalAmount,
      maturityAmount: plan.maturityAmount,
      remainingAmount: plan.totalAmount,
      status: 'pending', // Starts in pending until first payment
      payments
    });

    await userKitty.populate('planId');
    await cacheUtils.clearPattern(`user:${userId}:kitties:*`);

    return successResponse(res, 201, 'Enrollment created. Please proceed to payment.', userKitty);
  } catch (error) {
    console.error("💥 [ENROLL_FAIL]", error);
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Get user's kitties
const getMyKitties = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { status, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = { userId };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const kitties = await UserKitty.find(filter)
      .populate('planId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserKitty.countDocuments(filter);

    // Calculate stats
    const stats = await UserKitty.aggregate([
      { $match: { userId: new ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalKitties: { $sum: 1 },
          activeKitties: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          completedKitties: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalInvested: { $sum: '$totalPaid' },
          totalMaturity: { $sum: '$maturityAmount' }
        }
      }
    ]);

    const statsData = stats[0] || {
      totalKitties: 0,
      activeKitties: 0,
      completedKitties: 0,
      totalInvested: 0,
      totalMaturity: 0
    };

    // Get next payment details
    const nextPayment = await UserKitty.findOne({
      userId,
      status: 'active',
      'payments.status': 'pending'
    }).sort({ 'payments.dueDate': 1 });

    if (nextPayment) {
      const nextPaymentData = nextPayment.payments.find(p => p.status === 'pending');
      statsData.nextPaymentAmount = nextPaymentData.amount;
      statsData.nextPaymentDate = nextPaymentData.dueDate;
    } else {
      statsData.nextPaymentAmount = 0;
      statsData.nextPaymentDate = null;
    }

    return successResponse(res, 200, messages.DATA_FETCHED, {
      kitties,
      stats: statsData,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total
      }
    });
  } catch (error) {
    console.error('Error fetching user kitties:', error);
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Get specific kitty details
const getKittyDetails = async (req, res) => {
  try {
    const { kittyId } = req.params;
    const userId = req.user?._id;

    if (!ObjectId.isValid(kittyId)) {
      return errorResponse(res, 400, messages.INVALID_ID);
    }

    const kitty = await UserKitty.findOne({ _id: kittyId, userId })
      .populate('planId')
      .populate('userId', 'name email phoneNumber');

    if (!kitty) {
      return errorResponse(res, 404, 'Kitty not found');
    }

    return successResponse(res, 200, messages.DATA_FETCHED, kitty);
  } catch (error) {
    console.error('Error fetching kitty details:', error);
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Initiate kitty payment
const initiateKittyPayment = async (req, res) => {
  try {
    console.log("🚀 [STEP 0] API HIT");

    const { paymentId } = req.body;
    const userId = req.user?._id;

    console.log("👉 [STEP 1] Data Extracted", { paymentId, userId });

    if (!userId) {
      console.log("❌ [FAIL] No userId");
      return errorResponse(res, 401, "Unauthorized");
    }

    if (!paymentId) {
      console.log("❌ [FAIL] paymentId missing");
      return errorResponse(res, 400, "paymentId is required");
    }

    if (!ObjectId.isValid(paymentId)) {
      console.log("❌ [FAIL] Invalid paymentId");
      return errorResponse(res, 400, messages.INVALID_ID);
    }

    console.log("👉 [STEP 2] Fetching UserKitty");

    const userKitty = await UserKitty.findOne({
      userId,
      'payments._id': paymentId,
      status: { $in: ['active', 'pending'] }
    }).populate('planId');

    console.log("👉 [STEP 3] UserKitty Result:", userKitty?._id);

    if (!userKitty) {
      console.log("❌ [FAIL] UserKitty not found");
      return errorResponse(res, 404, 'Payment not found');
    }

    const payment = userKitty.payments.id(paymentId);

    console.log("👉 [STEP 4] Payment Found:", payment);

    if (!payment) {
      console.log("❌ [FAIL] Payment object null");
      return errorResponse(res, 404, 'Payment not found in array');
    }

    if (payment.status !== 'pending') {
      console.log("❌ [FAIL] Payment not pending:", payment.status);
      return errorResponse(res, 400, 'Payment is not pending');
    }

    console.log("👉 [STEP 5] Checking Razorpay keys");

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.log("❌ [FAIL] Razorpay keys missing");
      return errorResponse(res, 500, "Razorpay keys are not configured");
    }

    console.log("👉 [STEP 6] Creating Razorpay instance");

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    console.log("👉 [STEP 7] Creating Razorpay order");

    const order = await razorpay.orders.create({
      amount: Math.round(payment.amount * 100),
      currency: "INR",
      receipt: `KITTY-${String(userKitty._id).slice(-6)}-${Date.now()
        .toString()
        .slice(-6)}`,
      notes: {
        type: "KITTY",
        kittyId: String(userKitty._id),
        kittyPaymentId: String(payment._id),
        userId: String(userId),
        planId: String(userKitty.planId?._id || userKitty.planId),
      },
    });

    console.log("👉 [STEP 8] Razorpay Order Created:", order.id);

    payment.razorpayOrderId = order.id;

    console.log("👉 [STEP 9] Saving userKitty");

    await userKitty.save();

    console.log("👉 [STEP 10] Saved successfully");

    return successResponse(res, 200, 'Payment initiated successfully', {
      orderId: order.id,
      amount: payment.amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      companyName: 'Guru Jewellers',
      description: `Kitty payment for ${userKitty.planId.name}`,
      paymentId: payment._id
    });

  } catch (error) {
    console.log("eroorroororooro")
    console.error("💥 [CRASH] Error initiating kitty payment:", error);
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Get all kitty enrollments (Admin)
const getAllKittyEnrollments = async (req, res) => {
  try {
    const { status, planId, userId, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (planId) filter.planId = planId;
    if (userId) filter.userId = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const enrollments = await UserKitty.find(filter)
      .populate('planId', 'name category monthlyAmount')
      .populate('userId', 'name email phoneNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserKitty.countDocuments(filter);

    return successResponse(res, 200, messages.DATA_FETCHED, {
      enrollments,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total
      }
    });
  } catch (error) {
    console.error('Error fetching kitty enrollments:', error);
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Get specific kitty details for Admin
const getKittyDetailsForAdmin = async (req, res) => {
  try {
    const { kittyId } = req.params;

    if (!ObjectId.isValid(kittyId)) {
      return errorResponse(res, 400, messages.INVALID_ID);
    }

    const kitty = await UserKitty.findById(kittyId)
      .populate('planId')
      .populate('userId', 'name email phoneNumber');

    if (!kitty) {
      return errorResponse(res, 404, 'Kitty enrollment not found');
    }

    return successResponse(res, 200, messages.DATA_FETCHED, kitty);
  } catch (error) {
    console.error('Error fetching kitty details for admin:', error);
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Get kitty statistics (Admin)
const getKittyStatistics = async (req, res) => {
  try {
    const stats = await UserKitty.aggregate([
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          activeEnrollments: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          completedEnrollments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          totalInvestment: { $sum: '$totalPaid' },
          totalMaturityValue: { $sum: '$maturityAmount' }
        }
      }
    ]);

    const planStats = await KittyPlan.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalParticipants: { $sum: '$currentParticipants' }
        }
      }
    ]);

    const monthlyRevenue = await UserKitty.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: null,
          monthlyRevenue: { $sum: '$monthlyAmount' }
        }
      }
    ]);

    return successResponse(res, 200, messages.DATA_FETCHED, {
      overview: stats[0] || {
        totalEnrollments: 0,
        activeEnrollments: 0,
        completedEnrollments: 0,
        totalInvestment: 0,
        totalMaturityValue: 0
      },
      planStats,
      monthlyRevenue: monthlyRevenue[0]?.monthlyRevenue || 0
    });
  } catch (error) {
    console.error('Error fetching kitty statistics:', error);
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Seed dummy kitty plans + optional enrollments (Admin)
const seedDummyKittyData = async (req, res) => {
  try {
    const adminId = req.user?._id;
    const { createEnrollments = true, enrollmentsPerPlan = 2 } = req.body || {};

    if (!adminId) {
      return errorResponse(res, 401, messages.UNAUTHORIZED || "Unauthorized");
    }

    const existingPlans = await KittyPlan.countDocuments({});
    const createdPlans = [];

    if (existingPlans === 0) {
      const plansPayload = [
        {
          name: "Gold Saver Kitty",
          description: "A classic monthly kitty plan to build your jewellery fund.",
          duration: 12,
          monthlyAmount: 1000,
          totalAmount: 12000,
          maturityAmount: 13200,
          category: "gold",
          benefits: ["Bonus on maturity", "Exclusive making charge offers"],
          terms: ["Pay monthly before due date", "ID verification required"],
          interestRate: 10,
          processingFee: 0,
          tags: ["gold"],
          createdBy: adminId,
        },
        {
          name: "Silver Spark Kitty",
          description: "Start small and save monthly for silver jewellery.",
          duration: 10,
          monthlyAmount: 500,
          totalAmount: 5000,
          maturityAmount: 5400,
          category: "silver",
          benefits: ["Maturity bonus", "Free polishing on redemption"],
          terms: ["Monthly payments required", "Redemption in-store/online"],
          interestRate: 8,
          processingFee: 0,
          tags: ["silver"],
          createdBy: adminId,
        },
        {
          name: "Diamond Dream Kitty",
          description: "Premium kitty plan for diamond jewellery goals.",
          duration: 18,
          monthlyAmount: 2500,
          totalAmount: 45000,
          maturityAmount: 50400,
          category: "diamond",
          benefits: ["Higher maturity value", "Priority appointment"],
          terms: ["Timely payments required", "One plan per user at a time"],
          interestRate: 12,
          processingFee: 0,
          tags: ["diamond"],
          createdBy: adminId,
        },
        {
          name: "Platinum Prestige Kitty",
          description: "Long-term savings kitty with premium benefits.",
          duration: 24,
          monthlyAmount: 3000,
          totalAmount: 72000,
          maturityAmount: 82080,
          category: "platinum",
          benefits: ["Best maturity bonus", "VIP customer care"],
          terms: ["Auto-debit available", "Redeem on eligible products"],
          interestRate: 14,
          processingFee: 0,
          tags: ["platinum"],
          createdBy: adminId,
        },
      ];

      const inserted = await KittyPlan.insertMany(plansPayload);
      createdPlans.push(...inserted);
    }

    let createdEnrollments = 0;
    if (createEnrollments) {
      const plans = createdPlans.length ? createdPlans : await KittyPlan.find({}).limit(10);
      const users = await User.find({}).select("_id").limit(50);

      if (users.length > 0 && plans.length > 0) {
        for (const plan of plans) {
          const sampleUsers = users.slice(0, Math.max(0, Number(enrollmentsPerPlan) || 0));
          for (const u of sampleUsers) {
            const exists = await UserKitty.findOne({
              userId: u._id,
              planId: plan._id,
              status: { $in: ["active", "paused"] },
            });
            if (exists) continue;

            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + plan.duration);

            // Generate Full Installment Schedule for Seeding
            const payments = [];
            for (let i = 0; i < plan.duration; i++) {
              const dueDate = new Date(startDate);
              dueDate.setMonth(dueDate.getMonth() + i);
              payments.push({
                amount: plan.monthlyAmount,
                dueDate: dueDate,
                status: "pending",
              });
            }

            await UserKitty.create({
              planId: plan._id,
              userId: u._id,
              startDate,
              endDate,
              nextPaymentDate: startDate,
              monthlyAmount: plan.monthlyAmount,
              totalAmount: plan.totalAmount,
              maturityAmount: plan.maturityAmount,
              remainingAmount: plan.totalAmount,
              status: "pending",
              payments
            });

            createdEnrollments += 1;
          }
        }
      }
    }

    await cacheUtils.clearPattern("kitty:*");
    await cacheUtils.clearPattern("user:*:kitties:*");

    return successResponse(res, 201, "Dummy kitty data seeded", {
      createdPlans: createdPlans.length,
      createdEnrollments,
      plansSeeded: createdPlans.map((p) => ({ _id: p._id, name: p.name, category: p.category })),
    });
  } catch (error) {
    console.error("Error seeding dummy kitty data:", error);
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Record manual (offline) payment - Admin Only
const recordManualPayment = async (req, res) => {
  try {
    const { paymentId, method, receiptId, amount } = req.body;

    if (!paymentId || !method) {
      return errorResponse(res, 400, "paymentId and method are required");
    }

    if (!["cash", "bank_transfer"].includes(method)) {
      return errorResponse(res, 400, "Invalid manual payment method. Use 'cash' or 'bank_transfer'");
    }

    const { markPaymentAsPaid } = require("../services/kitty.service");
    
    const userKitty = await markPaymentAsPaid({
      paymentId,
      paymentMethod: method,
      transactionId: receiptId, // Using receiptId as transactionId for manual payments
    });

    return successResponse(res, 200, "Manual payment recorded successfully", userKitty);
  } catch (error) {
    console.error("Error recording manual payment:", error);
    return errorResponse(res, 500, error.message || messages.SERVER_ERROR);
  }
};

// Get all kitty transactions (Admin Only)
const getAllKittyTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await UserKitty.aggregate([
      { $unwind: "$payments" },
      { $match: { "payments.status": "paid" } },
      { $sort: { "payments.paymentDate": -1 } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "kittyplans",
          localField: "planId",
          foreignField: "_id",
          as: "planDetails"
        }
      },
      { $unwind: { path: "$planDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: "$payments._id",
          enrollmentId: "$_id",
          userId: 1,
          userName: "$userDetails.name",
          userEmail: "$userDetails.email",
          planName: "$planDetails.name",
          amount: "$payments.amount",
          paymentDate: "$payments.paymentDate",
          paymentMethod: "$payments.paymentMethod",
          transactionId: "$payments.transactionId",
          razorpayPaymentId: "$payments.razorpayPaymentId",
          status: "$payments.status"
        }
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: parseInt(limit) }],
          totalCount: [{ $count: "count" }]
        }
      }
    ]);

    const result = transactions[0] || { data: [], totalCount: [] };
    const data = result.data;
    const total = result.totalCount[0]?.count || 0;

    return successResponse(res, 200, messages.DATA_FETCHED, {
      transactions: data,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total
      }
    });
  } catch (error) {
    console.error("Error fetching kitty transactions:", error);
    return errorResponse(res, 500, messages.SERVER_ERROR);
  }
};

// Update kitty enrollment status (Admin only)
const updateKittyEnrollmentStatus = async (req, res) => {
  try {
    const { kittyId } = req.params;
    const { status, remarks } = req.body;

    if (!ObjectId.isValid(kittyId)) {
      return errorResponse(res, 400, messages.INVALID_ID);
    }

    const kitty = await UserKitty.findById(kittyId);
    if (!kitty) {
      return errorResponse(res, 404, 'Kitty enrollment not found');
    }

    if (!['completed', 'cancelled', 'active', 'paused'].includes(status)) {
      return errorResponse(res, 400, 'Invalid status update');
    }

    // Use model methods for business logic
    if (status === 'completed') {
      await kitty.markAsCompleted();
      // Send completion email
      try {
        const populatedKitty = await UserKitty.findById(kittyId)
          .populate('userId', 'name email')
          .populate('planId', 'name');

        if (populatedKitty && populatedKitty.userId && populatedKitty.userId.email) {
          const { sendEmail } = require("../services/notifications/email.service");
          const { getKittyCompletionTemplate } = require("../utils/kittyEmailTemplates");

          const emailHtml = getKittyCompletionTemplate({
            userName: populatedKitty.userId.name || 'Valued Customer',
            planName: populatedKitty.planId.name,
            totalPaid: populatedKitty.totalPaid,
            totalAmount: populatedKitty.totalAmount,
            maturityAmount: populatedKitty.maturityAmount,
            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
          });

          await sendEmail(
            populatedKitty.userId.email,
            `Congratulations! Your Kitty Plan is Completed: ${populatedKitty.planId.name}`,
            emailHtml
          );
          console.log("📧 [Admin] Completion email sent to:", populatedKitty.userId.email);
        }
      } catch (emailErr) {
        console.error("❌ [Admin] Failed to send completion email:", emailErr.message);
      }
    } else if (status === 'cancelled') {
      await kitty.cancelKitty(remarks || "Cancelled by Admin");
      // Also cancel any pending payments
      kitty.payments.forEach(p => {
        if (['pending', 'overdue'].includes(p.status)) {
          p.status = 'cancelled';
        }
      });
      await kitty.save();
    } else if (status === 'paused') {
      await kitty.pauseKitty(remarks || "Paused by Admin");
    } else if (status === 'active') {
      if (kitty.status === 'paused') {
        await kitty.resumeKitty();
      } else {
        kitty.status = 'active';
        await kitty.save();
      }
    }

    // Clear cache
    await cacheUtils.clearPattern(`user:${kitty.userId}:kitties:*`);
    await cacheUtils.clearPattern(`kitty:*`);

    return successResponse(res, 200, `Kitty enrollment marked as ${status} successfully`, kitty);
  } catch (error) {
    console.error('Error updating kitty status:', error);
    return errorResponse(res, 500, error.message || messages.SERVER_ERROR);
  }
};

// Cancel user's own kitty enrollment
const cancelKittyByUser = async (req, res) => {
  try {
    const { kittyId } = req.params;
    const userId = req.user?._id;

    if (!ObjectId.isValid(kittyId)) {
      return errorResponse(res, 400, messages.INVALID_ID);
    }

    const kitty = await UserKitty.findOne({ _id: kittyId, userId });

    if (!kitty) {
      return errorResponse(res, 404, 'Kitty enrollment not found');
    }

    if (kitty.status === 'cancelled' || kitty.status === 'completed') {
      return errorResponse(res, 400, `Cannot cancel a ${kitty.status} enrollment`);
    }

    // Process cancellation using model's method
    await kitty.cancelKitty("Cancelled by user via dashboard");

    // Optional: Cancel all future pending installments
    kitty.payments.forEach(p => {
      if (['pending', 'overdue', 'failed'].includes(p.status)) {
        p.status = 'cancelled';
      }
    });
    
    await kitty.save();

    // Clear cache
    await cacheUtils.clearPattern(`user:${userId}:kitties:*`);
    await cacheUtils.clearPattern(`kitty:*`);

    return successResponse(res, 200, 'Kitty enrollment cancelled successfully', kitty);
  } catch (error) {
    console.error('Error cancelling kitty enrollment:', error);
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
