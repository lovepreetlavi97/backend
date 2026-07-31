const { Transaction, Order } = require('../models/index');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const messages = require("../utils/messages");
const { cacheUtils } = require("../config/redis");
const { isValidId } = require("../utils/idUtils");

const createTransaction = async (req, res) => {
  try {
    const { orderId, paymentMethod, transactionId, amount, gateway, metadata } = req.body;
    const userId = req.user.id || req.user._id;

    if (!orderId || !paymentMethod || !transactionId || !amount) {
      return errorResponse(res, 400, "All fields are required: orderId, paymentMethod, transactionId, amount");
    }
    
    if (!isValidId(orderId)) {
      return errorResponse(res, 400, "Invalid order ID format");
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return errorResponse(res, 404, "Order not found");
    }

    const transaction = await Transaction.create({
      userId,
      orderId,
      paymentMethod,
      transactionId,
      amount: parseFloat(amount),
      gateway: gateway || 'Razorpay',
      status: 'Completed'
    });

    await cacheUtils.delPattern(`user_transactions_${userId}_*`);
    await cacheUtils.delPattern(`order_${orderId}_*`);

    return successResponse(res, 201, messages.TRANSACTION_CREATED, { transaction });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to create transaction");
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) {
      return errorResponse(res, 400, "Invalid transaction ID format");
    }

    const transaction = await Transaction.findByPk(id, {
      include: [{ model: Order, attributes: ['orderNumber', 'status', 'paymentStatus', 'finalAmount'] }]
    });

    if (!transaction) {
      return errorResponse(res, 404, messages.TRANSACTION_NOT_FOUND);
    }

    return successResponse(res, 200, messages.TRANSACTION_RETRIEVED, { transaction });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to retrieve transaction");
  }
};

const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: transactions } = await Transaction.findAndCountAll({
      where: { userId },
      include: [{ model: Order, attributes: ['orderNumber', 'status'] }],
      limit: parsedLimit,
      offset,
      order: [['id', 'DESC']]
    });

    return successResponse(res, 200, messages.TRANSACTIONS_RETRIEVED, {
      transactions,
      pagination: {
        total: count,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(count / parsedLimit)
      }
    });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to retrieve transactions");
  }
};

const getTransactionsByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!isValidId(orderId)) {
      return errorResponse(res, 400, "Invalid order ID format");
    }

    const transactions = await Transaction.findAll({ where: { orderId } });
    return successResponse(res, 200, messages.TRANSACTIONS_RETRIEVED, { transactions });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const updateTransactionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidId(id)) {
      return errorResponse(res, 400, "Invalid transaction ID format");
    }

    const transaction = await Transaction.findByPk(id);
    if (!transaction) {
      return errorResponse(res, 404, messages.TRANSACTION_NOT_FOUND);
    }

    await transaction.update({ status });
    return successResponse(res, 200, messages.TRANSACTION_UPDATED, { transaction });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

const getTransactionStats = async (req, res) => {
  try {
    const totalCount = await Transaction.count();
    return successResponse(res, 200, "Transaction statistics retrieved", { totalCount });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

module.exports = {
  createTransaction,
  getTransactionById,
  getUserTransactions,
  getTransactionsByOrderId,
  updateTransactionStatus,
  getTransactionStats
};
