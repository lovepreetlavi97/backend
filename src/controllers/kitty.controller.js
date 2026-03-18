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

    const plan = await KittyPlan.findByIdAndUpdate(
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

    // Check if there are active enrollments
    const activeEnrollments = await UserKitty.countDocuments({ 
      planId, 
      status: { $in: ['active', 'paused'] }
    });

    if (activeEnrollments > 0) {
      return errorResponse(res, 400, 'Cannot delete plan with active enrollments');
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

// Enroll user in kitty plan
const enrollInKittyPlan = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return errorResponse(res, 401, "Unauthorized: missing user");
    }

    if (!planId) {
      return errorResponse(res, 400, "planId is required");
    }

    if (!ObjectId.isValid(planId)) {
      return errorResponse(res, 400, messages.INVALID_ID);
    }

    // Check if plan exists and is available
    const plan = await KittyPlan.findById(planId);
    if (!plan) {
      return errorResponse(res, 404, 'Kitty plan not found');
    }

    if (!plan.isAvailableForEnrollment()) {
      return errorResponse(res, 400, 'Plan is not available for enrollment');
    }

    // Check if user is already enrolled
    const existingEnrollment = await UserKitty.findOne({
      userId,
      planId,
      status: { $in: ['active', 'paused'] }
    });

    if (existingEnrollment) {
      return errorResponse(res, 400, 'You are already enrolled in this plan');
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.duration);
    const nextPaymentDate = new Date(startDate);
    nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

    // Create user kitty enrollment
    const userKitty = await UserKitty.create({
      planId,
      userId,
      startDate,
      endDate,
      nextPaymentDate,
      monthlyAmount: plan.monthlyAmount,
      totalAmount: plan.totalAmount,
      maturityAmount: plan.maturityAmount,
      remainingAmount: plan.totalAmount,
      payments: [{
        amount: plan.monthlyAmount,
        dueDate: nextPaymentDate,
        status: 'pending'
      }]
    });

    // Increment plan participants
    await plan.incrementParticipants();

    // Populate plan details
    await userKitty.populate('planId');

    // Clear cache
    await cacheUtils.clearPattern(`user:${userId}:kitties:*`);

    return successResponse(res, 201, 'Successfully enrolled in kitty plan', userKitty);
  } catch (error) {
    console.error('Error enrolling in kitty plan:', error);
    if (error.message === 'Plan has reached maximum participants') {
      return errorResponse(res, 400, error.message);
    }
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
    const { paymentId } = req.body;
    const userId = req.user?._id;

    if (!ObjectId.isValid(paymentId)) {
      return errorResponse(res, 400, messages.INVALID_ID);
    }

    // Find the user's kitty and payment
    const userKitty = await UserKitty.findOne({
      userId,
      'payments._id': paymentId,
      status: 'active'
    }).populate('planId');

    if (!userKitty) {
      return errorResponse(res, 404, 'Payment not found');
    }

    const payment = userKitty.payments.id(paymentId);
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

    // Create Razorpay order and tag it as KITTY in notes (used during verification)
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

    // Update payment with order ID
    payment.razorpayOrderId = order.id;
    await userKitty.save();

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
    console.error('Error initiating kitty payment:', error);
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
            const nextPaymentDate = new Date(startDate);
            nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

            await UserKitty.create({
              planId: plan._id,
              userId: u._id,
              startDate,
              endDate,
              nextPaymentDate,
              monthlyAmount: plan.monthlyAmount,
              totalAmount: plan.totalAmount,
              maturityAmount: plan.maturityAmount,
              remainingAmount: plan.totalAmount,
              payments: [
                {
                  amount: plan.monthlyAmount,
                  dueDate: nextPaymentDate,
                  status: "pending",
                },
              ],
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
  seedDummyKittyData
};
