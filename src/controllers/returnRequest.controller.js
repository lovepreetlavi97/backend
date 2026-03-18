const ReturnRequest = require('../models/returnRequest.model');
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const mongoose = require('mongoose');
const { sendEmail } = require('../services/notifications/email.service');
const { successResponse, errorResponse } = require("../utils/responseUtil");

// 1. Create Return Request (From Website)
const createReturnRequest = async (req, res) => {
  try {
    const { orderId, products, returnReason, attachments } = req.body;

    // Find order
    const order = await Order.findById(orderId).populate('userId');
    if (!order) {
      return errorResponse(res, 404, "Order not found");
    }

    // Determine return eligibility (within 7 days of delivery)
    if (order.status !== 'Delivered' || !order.deliveredAt) {
      return errorResponse(res, 400, "Return is allowed only for delivered orders");
    }
    const diffDays = (Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) {
      return errorResponse(res, 400, "Return window (7 days) has expired");
    }

    // Calculate total return amount based on selected products
    let refundAmount = 0;
    const validatedProducts = [];
    for (const reqProduct of products) {
      const orderProduct = order.products.find(p => p.productId.toString() === reqProduct.productId);
      if (!orderProduct) {
        return errorResponse(res, 400, `Product ${reqProduct.productId} not found in this order`);
      }
      if (reqProduct.quantity > orderProduct.quantity) {
        return errorResponse(res, 400, `Return quantity exceeds ordered quantity for product ${reqProduct.productId}`);
      }

      const unitPrice = orderProduct.price; // Or discounted price if applicable
      const itemRefund = unitPrice * reqProduct.quantity;
      refundAmount += itemRefund;

      validatedProducts.push({
        productId: reqProduct.productId,
        quantity: reqProduct.quantity,
        price: unitPrice,
        reason: reqProduct.reason
      });
    }

    const returnRequest = new ReturnRequest({
      orderId: order._id,
      userId: order.userId ? order.userId._id : null,
      products: validatedProducts,
      returnReason,
      refundAmount,
      attachments: attachments || []
    });

    await returnRequest.save();

    // Update main order status to reflect an active return flow
    order.status = 'Returned';
    order.returnDetails = {
      returnedAt: new Date(),
      reason: returnReason,
      returnInitiatedBy: 'User'
    };
    order.statusHistory.push({
      status: 'Returned',
      timestamp: new Date(),
      notes: 'User requested return with detailed form'
    });
    await order.save();


    // Send Email to User referencing the new ReturnRequest ID
    const userEmail = order.userId ? order.userId.email : order.guestEmail;
    const userName = order.userId ? order.userId.name : (order.shippingAddress?.contactName || 'Valued Customer');
    if (userEmail) {
      await sendEmail(
        userEmail,
        `Return Request Received - ${order.orderNumber}`,
        `<html><body>
            <h2>Return Request Received</h2>
            <p>Dear ${userName},</p>
            <p>We have successfully received your return request for Order <b>#${order.orderNumber}</b>.</p>
            <p>Your return ID is: <b>${returnRequest._id}</b></p>
            <p>Reason: ${returnReason}</p>
            <p>Our team will review your request and get back to you shortly.</p>
            <p>Thank you,</p>
            <p>Guru Jewellers Team</p>
         </body></html>`
      );
    }

    return successResponse(res, 201, "Return request submitted successfully", { returnRequest });

  } catch (error) {
    console.error("Create Return Request Error:", error);
    return errorResponse(res, 500, error.message || "Failed to create return request");
  }
};

// 2. Get All Return Requests (Admin)
const getAllReturnRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      returnStatus,
      refundStatus,
      search
    } = req.query;

    const query = {};

    if (returnStatus) query.returnStatus = returnStatus;
    if (refundStatus) query.refundStatus = refundStatus;
    // Basic search setup, can be expanded to join with User/Order models if robust search is needed
    // Usually handled via aggregation if searching nested order/user properties.
    if (search) {
      if (mongoose.Types.ObjectId.isValid(search)) {
        query.$or = [{ orderId: search }, { userId: search }, { _id: search }];
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const returns = await ReturnRequest.find(query)
      .populate({ path: 'orderId', select: 'orderNumber createdAt' })
      .populate({ path: 'userId', select: 'name email phone' })
      .populate({ path: 'products.productId', select: 'name image slug' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ReturnRequest.countDocuments(query);

    return successResponse(res, 200, "Returns retrieved successfully", {
      returns,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("Get All Returns Error:", error);
    return errorResponse(res, 500, error.message || "Failed to fetch returns");
  }
};

// 3. Get Single Return Request (Admin/User)
const getReturnRequestById = async (req, res) => {
  try {
    const returnReq = await ReturnRequest.findById(req.params.id)
      .populate({ path: 'orderId', select: 'orderNumber createdAt shippingAddress billingAddress status totalAmount finalAmount' })
      .populate({ path: 'userId', select: 'name email phone' })
      .populate({ path: 'products.productId', select: 'name image slug price' });

    if (!returnReq) {
      return errorResponse(res, 404, "Return request not found");
    }

    // Add authorization check here if accessed by User

    return successResponse(res, 200, "Return request retrieved successfully", { return: returnReq });
  } catch (error) {
    console.error("Get Return Request Error:", error);
    return errorResponse(res, 500, error.message || "Failed to fetch return request");
  }
};

// 4. Update Return Request Status (Admin)
const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // status: pending, approved, rejected, completed

    const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 400, "Invalid return status");
    }

    const returnReq = await ReturnRequest.findById(id).populate('orderId').populate('userId');
    if (!returnReq) {
      return errorResponse(res, 404, "Return request not found");
    }

    const oldStatus = returnReq.returnStatus;
    returnReq.returnStatus = status;
    if (notes) returnReq.adminNotes = notes;

    await returnReq.save();

    const order = returnReq.orderId;
    const userEmail = returnReq.userId ? returnReq.userId.email : order.guestEmail;
    const userName = returnReq.userId ? returnReq.userId.name : (order.shippingAddress?.contactName || 'Valued Customer');

    // If status changes to approved/rejected, notify user
    if (status !== oldStatus && (status === 'approved' || status === 'rejected' || status === 'completed')) {
      // Also optionally update the main Order status if rejected back to Delivered, or keep it Returned.
      if (status === 'rejected') {
        order.status = 'Delivered'; // Revert back
        order.statusHistory.push({
          status: 'Delivered',
          timestamp: new Date(),
          notes: `Return request ${id} was rejected. Note: ${notes || 'N/A'}`
        });
        await order.save();
      }

      if (userEmail) {
        const actionWord = status.charAt(0).toUpperCase() + status.slice(1);
        await sendEmail(
          userEmail,
          `Update on Return Request - ${order.orderNumber}`,
          `<html><body>
                <h2>Return Request ${actionWord}</h2>
                <p>Dear ${userName},</p>
                <p>Your return request for Order <b>#${order.orderNumber}</b> has been marked as <b>${actionWord}</b>.</p>
                ${notes ? `<p>Admin Note: ${notes}</p>` : ''}
                <p>If you have any questions, please contact support.</p>
                <p>Thank you,</p>
                <p>Guru Jewellers Team</p>
             </body></html>`
        );
      }
    }

    return successResponse(res, 200, "Return status updated successfully", { return: returnReq });
  } catch (error) {
    console.error("Update Return Status Error:", error);
    return errorResponse(res, 500, error.message || "Failed to update return status");
  }
};

// 5. Update Refund / Tracking Info (Admin)
const updateReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const returnReq = await ReturnRequest.findByIdAndUpdate(id, updateData, { new: true })
      .populate({ path: 'orderId', select: 'orderNumber' })
      .populate({ path: 'userId', select: 'name email phone' });

    if (!returnReq) {
      return errorResponse(res, 404, "Return request not found");
    }

    return successResponse(res, 200, "Return request updated", { return: returnReq });
  } catch (error) {
    console.error("Update Return Error:", error);
    return errorResponse(res, 500, error.message || "Failed to update return");
  }
}

// 6. Process Refund
const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { refundAmount, refundMethod, notes } = req.body;

    const returnReq = await ReturnRequest.findById(id).populate('orderId');
    if (!returnReq) {
      return errorResponse(res, 404, "Return request not found");
    }

    if (returnReq.returnStatus !== 'approved' && returnReq.returnStatus !== 'completed') {
      return errorResponse(res, 400, "Return request must be approved to process refund");
    }

    returnReq.refundAmount = refundAmount;
    returnReq.refundMethod = refundMethod;
    returnReq.refundStatus = 'processed';
    if (notes) returnReq.adminNotes = notes;

    await returnReq.save();

    // Update relevant Order schema refund details as well
    const order = returnReq.orderId;
    order.refundDetails = {
      refundedAt: new Date(),
      refundAmount: refundAmount,
      refundStatus: 'Completed',
      refundTransactionId: `RET-${id}`
    };
    order.status = 'Refunded'; // Or leave as Returned based on business logic. Usually Refunded is terminal.
    order.statusHistory.push({
      status: 'Refunded',
      timestamp: new Date(),
      notes: `Refund processed via Return Request module.`
    });

    await order.save();

    return successResponse(res, 200, "Refund processed successfully", { return: returnReq });
  } catch (error) {
    console.error("Process Refund Error:", error);
    return errorResponse(res, 500, error.message || "Failed to process refund");
  }
}


module.exports = {
  createReturnRequest,
  getAllReturnRequests,
  getReturnRequestById,
  updateReturnStatus,
  updateReturn,
  processRefund
};
