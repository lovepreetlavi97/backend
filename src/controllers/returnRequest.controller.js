const { ReturnRequest, Order, Product, User } = require('../models');
const { sendEmail } = require('../services/notifications/email.service');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const { isValidId } = require('../utils/idUtils');

const createReturnRequest = async (req, res) => {
  try {
    const { orderId, returnReason } = req.body;

    if (!isValidId(orderId)) {
      return errorResponse(res, 400, "Invalid order ID format");
    }

    const order = await Order.findByPk(orderId, { include: [{ model: User }] });
    if (!order) {
      return errorResponse(res, 404, "Order not found");
    }

    const returnRequest = await ReturnRequest.create({
      orderId: order.id,
      userId: order.userId,
      returnReason,
      refundAmount: order.finalAmount || 0,
      returnStatus: 'pending'
    });

    await order.update({ status: 'Returned' });

    return successResponse(res, 201, "Return request submitted successfully", { returnRequest });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to create return request");
  }
};

const getAllReturnRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows: returns } = await ReturnRequest.findAndCountAll({
      include: [
        { model: Order, attributes: ['orderNumber', 'createdAt'] },
        { model: User, attributes: ['name', 'email', 'phone'] }
      ],
      limit: parsedLimit,
      offset,
      order: [['id', 'DESC']]
    });

    return successResponse(res, 200, "Returns retrieved successfully", {
      returns,
      pagination: {
        total: count,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(count / parsedLimit)
      }
    });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to fetch returns");
  }
};

const getReturnRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return errorResponse(res, 400, "Invalid ID");

    const returnReq = await ReturnRequest.findByPk(id, {
      include: [
        { model: Order },
        { model: User, attributes: ['name', 'email', 'phone'] }
      ]
    });

    if (!returnReq) {
      return errorResponse(res, 404, "Return request not found");
    }

    return successResponse(res, 200, "Return request retrieved successfully", { return: returnReq });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to fetch return request");
  }
};

const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!isValidId(id)) return errorResponse(res, 400, "Invalid ID");

    const returnReq = await ReturnRequest.findByPk(id);
    if (!returnReq) {
      return errorResponse(res, 404, "Return request not found");
    }

    await returnReq.update({ returnStatus: status, adminNotes: notes });
    return successResponse(res, 200, "Return status updated successfully", { return: returnReq });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to update return status");
  }
};

const updateReturn = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return errorResponse(res, 400, "Invalid ID");

    const returnReq = await ReturnRequest.findByPk(id);
    if (!returnReq) return errorResponse(res, 404, "Return request not found");

    await returnReq.update(req.body);
    return successResponse(res, 200, "Return request updated", { return: returnReq });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to update return");
  }
};

const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { refundAmount, refundMethod } = req.body;

    if (!isValidId(id)) return errorResponse(res, 400, "Invalid ID");

    const returnReq = await ReturnRequest.findByPk(id);
    if (!returnReq) return errorResponse(res, 404, "Return request not found");

    await returnReq.update({
      refundAmount,
      refundMethod,
      refundStatus: 'processed'
    });

    return successResponse(res, 200, "Refund processed successfully", { return: returnReq });
  } catch (error) {
    return errorResponse(res, 500, error.message || "Failed to process refund");
  }
};

module.exports = {
  createReturnRequest,
  getAllReturnRequests,
  getReturnRequestById,
  updateReturnStatus,
  updateReturn,
  processRefund
};
