const {
  create,
  findOne,
  findMany,
  findAndUpdate
} = require('../services/mongodb/mongoService');

const { Transaction, Order } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");
const mongoose = require('mongoose');

// Create a new transaction
const createTransaction = async (req, res) => {
  try {
    const { orderId, paymentMethod, transactionId, amount, gateway, metadata } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!orderId || !paymentMethod || !transactionId || !amount) {
      return errorResponse(res, 400, "All fields are required: orderId, paymentMethod, transactionId, amount");
    }
    
    // Validate order ID format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return errorResponse(res, 400, "Invalid order ID format");
    }
    
    // Validate payment method
    const validPaymentMethods = ['Card', 'PayPal', 'Razorpay', 'Bank Transfer', 'UPI', 'Wallet'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return errorResponse(res, 400, `Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`);
    }
    
    // Validate amount
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return errorResponse(res, 400, "Amount must be a positive number");
    }
    
    // Check if order exists and belongs to user
    const orderExists = await Order.exists({ 
      _id: orderId,
      userId,
      isDeleted: { $ne: true }
    });
    
    if (!orderExists) {
      return errorResponse(res, 404, "Order not found or doesn't belong to the user");
    }
    
    // Check if transaction already exists for this order with same transactionId
    const existingTransaction = await Transaction.findOne({
      orderId,
      transactionId
    });
    
    if (existingTransaction) {
      return errorResponse(res, 409, "Transaction with this ID already exists for this order");
    }

    // Create transaction
    const transactionData = { 
      userId, 
      orderId, 
      paymentMethod, 
      transactionId, 
      amount: parseFloat(amount),
      gateway,
      metadata: metadata || {}
    };
    
    const transaction = await create(Transaction, transactionData);
    
    // Clear cache
    await cacheUtils.delPattern(`user_transactions_${userId}_*`);
    await cacheUtils.delPattern(`order_${orderId}_*`);
    
    return successResponse(res, 201, messages.TRANSACTION_CREATED, { transaction });

  } catch (error) {
    console.error("Create transaction error:", error);
    return errorResponse(res, 500, error.message || "Failed to create transaction");
  }
};

// Get a transaction by ID
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Validate transaction ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid transaction ID format");
    }
    
    // Try to get from cache first
    const cacheKey = `transaction_${id}_${userId}`;
    const cachedTransaction = await cacheUtils.get(cacheKey);
    
    if (cachedTransaction) {
      return successResponse(res, 200, messages.TRANSACTION_RETRIEVED, { 
        transaction: cachedTransaction 
      });
    }
    
    // Get transaction with populated order details
    const transaction = await Transaction.findOne({ 
      _id: id,
      userId 
    })
    .populate('orderId', 'orderNumber status paymentStatus finalAmount')
    .lean();

    if (!transaction) {
      return errorResponse(res, 404, messages.TRANSACTION_NOT_FOUND);
    }
    
    // Cache the result
    await cacheUtils.set(cacheKey, transaction, 600); // Cache for 10 minutes
    
    return successResponse(res, 200, messages.TRANSACTION_RETRIEVED, { transaction });

  } catch (error) {
    console.error("Get transaction error:", error);
    return errorResponse(res, 500, error.message || "Failed to retrieve transaction");
  }
};

// Get all transactions for a user with pagination and filters
const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      status,
      paymentMethod,
      startDate,
      endDate
    } = req.query;
    
    // Create cache key
    const cacheKey = `user_transactions_${userId}_${page}_${limit}_${sortBy}_${sortOrder}_${status || ''}_${paymentMethod || ''}_${startDate || ''}_${endDate || ''}`;
    
    // Try to get from cache first
    const cachedData = await cacheUtils.get(cacheKey);
    if (cachedData) {
      return successResponse(res, 200, messages.TRANSACTIONS_RETRIEVED, cachedData);
    }
    
    // Build query
    const query = { userId };
    
    if (status) {
      query.status = status;
    }
    
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }
    
    // Date filter
    if (startDate || endDate) {
      query.createdAt = {};
      
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateTime;
      }
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    
    // Execute query with pagination
    const transactions = await Transaction.find(query)
      .populate('orderId', 'orderNumber status')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOptions)
      .lean();
    
    const total = await Transaction.countDocuments(query);
    
    const result = {
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    };
    
    // Cache the result
    await cacheUtils.set(cacheKey, result, 300); // Cache for 5 minutes
    
    return successResponse(res, 200, 
      transactions.length > 0 ? messages.TRANSACTIONS_RETRIEVED : messages.TRANSACTIONS_NOT_FOUND, 
      result
    );

  } catch (error) {
    console.error("Get user transactions error:", error);
    return errorResponse(res, 500, error.message || "Failed to retrieve transactions");
  }
};

// Get transactions by order ID
const getTransactionsByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;
    
    // Validate order ID format
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return errorResponse(res, 400, "Invalid order ID format");
    }
    
    // Check if order belongs to user
    const orderExists = await Order.exists({ 
      _id: orderId,
      userId,
      isDeleted: { $ne: true }
    });
    
    if (!orderExists) {
      return errorResponse(res, 404, "Order not found or doesn't belong to the user");
    }
    
    // Try to get from cache first
    const cacheKey = `order_transactions_${orderId}`;
    const cachedTransactions = await cacheUtils.get(cacheKey);
    
    if (cachedTransactions) {
      return successResponse(res, 200, messages.TRANSACTIONS_RETRIEVED, { 
        transactions: cachedTransactions 
      });
    }
    
    // Get transactions for this order
    const transactions = await Transaction.find({ orderId }).lean();
    
    // Cache the result
    await cacheUtils.set(cacheKey, transactions, 600); // Cache for 10 minutes
    
    return successResponse(res, 200, 
      transactions.length > 0 ? messages.TRANSACTIONS_RETRIEVED : "No transactions found for this order", 
      { transactions }
    );
  } catch (error) {
    console.error("Get order transactions error:", error);
    return errorResponse(res, 500, error.message || "Failed to retrieve transactions for this order");
  }
};

// Update transaction status
const updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, metadata } = req.body;
    
    // Validate transaction ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid transaction ID format");
    }
    
    // Validate status
    const validStatuses = ['Pending', 'Completed', 'Failed', 'Refunded'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Find transaction first
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return errorResponse(res, 404, messages.TRANSACTION_NOT_FOUND);
    }
    
    // Update transaction
    transaction.status = status;
    
    // Update metadata if provided
    if (metadata) {
      transaction.metadata = {
        ...transaction.metadata,
        ...metadata,
        lastUpdated: new Date()
      };
    }
    
    // Add timestamp for status change
    transaction[`${status.toLowerCase()}At`] = new Date();
    
    await transaction.save();
    
    // Clear cache
    await cacheUtils.del(`transaction_${id}_${transaction.userId}`);
    await cacheUtils.delPattern(`user_transactions_${transaction.userId}_*`);
    await cacheUtils.delPattern(`order_${transaction.orderId}_*`);
    await cacheUtils.delPattern(`order_transactions_${transaction.orderId}`);
    
    return successResponse(res, 200, messages.TRANSACTION_UPDATED, { transaction });

  } catch (error) {
    console.error("Update transaction error:", error);
    return errorResponse(res, 500, error.message || "Failed to update transaction");
  }
};

// Get transaction statistics (admin only)
const getTransactionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Try to get from cache first
    const cacheKey = `transaction_stats_${startDate || 'all'}_${endDate || 'all'}`;
    const cachedStats = await cacheUtils.get(cacheKey);
    
    if (cachedStats) {
      return successResponse(res, 200, "Transaction statistics retrieved", cachedStats);
    }
    
    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = endDateTime;
      }
    }
    
    // Calculate statistics
    const [
      totalCount,
      totalAmount,
      completedCount,
      completedAmount,
      failedCount,
      pendingCount,
      byPaymentMethod
    ] = await Promise.all([
      Transaction.countDocuments(dateFilter),
      Transaction.aggregate([
        { $match: dateFilter },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Transaction.countDocuments({ ...dateFilter, status: 'Completed' }),
      Transaction.aggregate([
        { $match: { ...dateFilter, status: 'Completed' } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Transaction.countDocuments({ ...dateFilter, status: 'Failed' }),
      Transaction.countDocuments({ ...dateFilter, status: 'Pending' }),
      Transaction.aggregate([
        { $match: dateFilter },
        { $group: { _id: "$paymentMethod", count: { $sum: 1 }, amount: { $sum: "$amount" } } }
      ])
    ]);
    
    const stats = {
      totalCount,
      totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0,
      completedCount,
      completedAmount: completedAmount.length > 0 ? completedAmount[0].total : 0,
      failedCount,
      pendingCount,
      successRate: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
      byPaymentMethod: byPaymentMethod.reduce((acc, method) => {
        acc[method._id] = { count: method.count, amount: method.amount };
        return acc;
      }, {})
    };
    
    // Cache the result
    await cacheUtils.set(cacheKey, stats, 600); // Cache for 10 minutes
    
    return successResponse(res, 200, "Transaction statistics retrieved", stats);
  } catch (error) {
    console.error("Get transaction stats error:", error);
    return errorResponse(res, 500, error.message || "Failed to retrieve transaction statistics");
  }
};

// Export all functions
module.exports = {
  createTransaction,
  getTransactionById,
  getUserTransactions,
  getTransactionsByOrderId,
  updateTransactionStatus,
  getTransactionStats
};
