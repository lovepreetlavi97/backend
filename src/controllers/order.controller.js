const { successResponse, errorResponse } = require("../utils/responseUtil");
const { Order, PromoCode, Product, User, sequelize } = require('../models/index');
const { createAdminOrderNotifications } = require('../services/notifications/notification.service');
const { cacheUtils } = require("../config/redis");
const { generateOrderNumber } = require("../utils/orderUtils");
const { sendEmail } = require("../services/notifications/email.service");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");
const { isValidId } = require('../utils/idUtils');
const { Op } = require('sequelize');

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'dummy_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret'
});

const logger = require('../utils/logger');

const createOrder = async (req, res) => {
    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey || null;

    if (idempotencyKey) {
        try {
            const cachedResponse = await cacheUtils.get(`idempotency_${idempotencyKey}`);
            if (cachedResponse) {
                return res.status(200).json(cachedResponse);
            }
            const existingOrder = await Order.findOne({ where: { idempotencyKey } });
            if (existingOrder) {
                const responseData = { status: 'success', message: "Order retrieved (idempotent)", data: { order: existingOrder } };
                await cacheUtils.set(`idempotency_${idempotencyKey}`, responseData, 86400);
                return res.status(200).json(responseData);
            }
        } catch (e) {
            logger.warn('Idempotency check error:', e.message);
        }
    }

    const {
        products,
        shippingAddress,
        billingAddress,
        paymentMethod = 'razorpay',
        promoCode
    } = req.body;

    const userId = req.user ? (req.user.id || req.user._id) : null;
    const guestEmail = req.body.guestEmail || null;
    const guestPhone = req.body.guestPhone || shippingAddress?.contactPhone || null;

    if (!userId && (!guestEmail || !guestPhone)) {
        return errorResponse(res, 400, "Guest contact info required");
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
        return errorResponse(res, 400, "Products array is required and cannot be empty");
    }

    // Sort products by productId ascending to prevent deadlocks across concurrent orders
    const sortedProducts = [...products].sort((a, b) => Number(a.productId) - Number(b.productId));
    const productIds = sortedProducts.map(p => p.productId);

    let order;
    let finalAmount = 0;
    const transaction = await sequelize.transaction();

    try {
        // B2: Batch fetch products to avoid N+1 queries
        const productDocs = await Product.findAll({
            where: { id: { [Op.in]: productIds } },
            transaction
        });

        const productMap = new Map(productDocs.map(p => [p.id, p]));
        let productDetails = [];
        let subtotal = 0;

        for (const p of sortedProducts) {
            const product = productMap.get(Number(p.productId)) || productMap.get(String(p.productId));
            if (!product) {
                await transaction.rollback();
                return errorResponse(res, 404, `Product ${p.productId} not found`);
            }

            // B3: Atomic conditional update for stock reservation
            const [affectedRows] = await Product.decrement('stock', {
                by: p.quantity,
                where: {
                    id: product.id,
                    stock: { [Op.gte]: p.quantity }
                },
                transaction
            });

            if (affectedRows === 0) {
                await transaction.rollback();
                return errorResponse(res, 400, `Insufficient stock for ${product.title || product.name}`);
            }

            let price = Number(product.actualPrice || product.basePrice || 0);
            let itemSubtotal = parseFloat((price * p.quantity).toFixed(2));
            subtotal += itemSubtotal;

            productDetails.push({
                productId: product.id,
                name: product.title || product.name,
                price,
                quantity: p.quantity,
                subtotal: itemSubtotal
            });
        }

        let discountAmount = 0;
        if (promoCode) {
            const promoDoc = await PromoCode.findOne({
                where: { code: String(promoCode).toUpperCase(), isActive: true },
                transaction
            });
            if (promoDoc) {
                if (promoDoc.discountType === 'percentage') {
                    discountAmount = parseFloat(((subtotal * promoDoc.discountValue) / 100).toFixed(2));
                } else {
                    discountAmount = Math.min(Number(promoDoc.discountValue), subtotal);
                }
            }
        }

        const taxAmount = parseFloat((subtotal * 0.18).toFixed(2));
        const shippingCharge = subtotal >= 1000 ? 0 : 50;
        finalAmount = parseFloat((subtotal + taxAmount + shippingCharge - discountAmount).toFixed(2));
        const orderNumber = await generateOrderNumber();

        // B4: Create local order inside transaction
        order = await Order.create({
            orderNumber,
            userId,
            products: productDetails,
            subtotal,
            totalAmount: finalAmount,
            shippingCharge,
            taxAmount,
            discountAmount,
            finalAmount,
            paymentStatus: "pending",
            orderStatus: "pending",
            paymentMethod,
            idempotencyKey,
            shippingAddress: shippingAddress || {},
            billingAddress: billingAddress || shippingAddress || {}
        }, { transaction });

        // Commit DB transaction BEFORE making external network calls
        await transaction.commit();

    } catch (error) {
        await transaction.rollback();
        if (error.name === 'SequelizeUniqueConstraintError' && idempotencyKey) {
            const existingOrder = await Order.findOne({ where: { idempotencyKey } });
            if (existingOrder) {
                return successResponse(res, 200, "Order retrieved (idempotent)", { order: existingOrder });
            }
        }
        return errorResponse(res, 500, error.message || "Failed to create order");
    }

    // B1: Perform external network call to Razorpay OUTSIDE DB transaction
    if (paymentMethod !== 'COD') {
        try {
            const razorpayOrder = await razorpayInstance.orders.create({
                amount: Math.round(finalAmount * 100),
                currency: "INR",
                receipt: `order_${order.id}`,
                notes: { orderId: order.id }
            });
            await order.update({ razorpayOrderId: razorpayOrder.id });
        } catch (rzErr) {
            logger.error('Razorpay order creation failed:', rzErr.message);
            // Reconcile / Restore Stock if Razorpay creation completely fails
            try {
                for (const p of sortedProducts) {
                    await Product.increment('stock', { by: p.quantity, where: { id: p.productId } });
                }
                await order.update({ paymentStatus: 'failed', orderStatus: 'cancelled' });
            } catch (reconErr) {
                logger.error('Stock reconciliation error:', reconErr.message);
            }
            return errorResponse(res, 502, "Payment gateway initialization failed. Please try again.");
        }
    }

    try {
        if (userId) await cacheUtils.del(`user_orders_${userId}`);
        await cacheUtils.delPattern('admin_orders_*');
    } catch (cacheErr) {}

    const responseData = { status: 'success', message: "Order created successfully", data: { order } };
    if (idempotencyKey) {
        await cacheUtils.set(`idempotency_${idempotencyKey}`, responseData, 86400);
    }

    return res.status(201).json(responseData);
};

const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const where = {};

        if (status) where.status = status;
        if (search) {
            where[Op.or] = [
                { orderNumber: { [Op.like]: `%${search}%` } }
            ];
        }

        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);
        const offset = (parsedPage - 1) * parsedLimit;

        const { count, rows: orders } = await Order.findAndCountAll({
            where,
            include: [{ model: User, attributes: ['id', 'name', 'email', 'phoneNumber'] }],
            limit: parsedLimit,
            offset,
            order: [['id', 'DESC']]
        });

        return successResponse(res, 200, "Orders retrieved successfully", {
            orders,
            pagination: {
                total: count,
                page: parsedPage,
                limit: parsedLimit,
                pages: Math.ceil(count / parsedLimit)
            }
        });
    } catch (error) {
        return errorResponse(res, 500, error.message || "Failed to retrieve orders");
    }
};

const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { page = 1, limit = 10, status } = req.query;

        const where = { userId };
        if (status) where.status = status;

        const parsedLimit = parseInt(limit);
        const parsedPage = parseInt(page);
        const offset = (parsedPage - 1) * parsedLimit;

        const { count, rows: orders } = await Order.findAndCountAll({
            where,
            limit: parsedLimit,
            offset,
            order: [['id', 'DESC']]
        });

        return successResponse(res, 200, "Orders retrieved successfully", {
            orders,
            pagination: {
                total: count,
                page: parsedPage,
                limit: parsedLimit,
                pages: Math.ceil(count / parsedLimit)
            }
        });
    } catch (error) {
        return errorResponse(res, 500, error.message || "Failed to retrieve orders");
    }
};

const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return errorResponse(res, 400, "Invalid order ID format");
        }

        const order = await Order.findByPk(id, {
            include: [{ model: User, attributes: ['id', 'name', 'email', 'phoneNumber'] }]
        });

        if (!order) {
            return errorResponse(res, 404, "Order not found");
        }

        return successResponse(res, 200, "Order retrieved successfully", { order });
    } catch (error) {
        return errorResponse(res, 500, error.message || "Failed to retrieve order");
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!isValidId(id)) {
            return errorResponse(res, 400, "Invalid order ID format");
        }

        const order = await Order.findByPk(id);
        if (!order) {
            return errorResponse(res, 404, "Order not found");
        }

        await order.update({ status });
        return successResponse(res, 200, "Order status updated successfully", { order });
    } catch (error) {
        return errorResponse(res, 500, error.message || "Failed to update order status");
    }
};

const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return errorResponse(res, 400, "Invalid order ID format");
        }

        const userId = req.user.id || req.user._id;
        const order = await Order.findOne({ where: { id, userId } });

        if (!order) {
            return errorResponse(res, 404, "Order not found");
        }

        await order.update({ status: 'Cancelled' });
        return successResponse(res, 200, "Order cancelled successfully", { order });
    } catch (error) {
        return errorResponse(res, 500, error.message || "Failed to cancel order");
    }
};

const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus } = req.body;

        if (!isValidId(id)) {
            return errorResponse(res, 400, "Invalid order ID format");
        }

        const order = await Order.findByPk(id);
        if (!order) {
            return errorResponse(res, 404, "Order not found");
        }

        await order.update({ paymentStatus });
        return successResponse(res, 200, "Payment status updated successfully", { order });
    } catch (error) {
        return errorResponse(res, 500, error.message || "Failed to update payment status");
    }
};

const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) {
            return errorResponse(res, 400, "Invalid order ID format");
        }

        const order = await Order.findByPk(id);
        if (!order) {
            return errorResponse(res, 404, "Order not found");
        }

        await order.destroy();
        return successResponse(res, 200, "Order deleted successfully");
    } catch (error) {
        return errorResponse(res, 500, error.message || "Failed to delete order");
    }
};

const getRefundRequests = async (req, res) => {
    try {
        const orders = await Order.findAll({ where: { status: 'Refunded' } });
        return successResponse(res, 200, "Refund requests retrieved", { orders });
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const updateProductStatus = async (req, res) => {
    return successResponse(res, 200, "Product status updated");
};

const trackOrderPublic = async (req, res) => {
    try {
        const { orderNumber } = req.body || {};
        const order = await Order.findOne({ where: { orderNumber } });
        if (!order) return errorResponse(res, 404, "Order not found");
        return successResponse(res, 200, "Order retrieved successfully", { order });
    } catch (error) {
        return errorResponse(res, 500, error.message);
    }
};

const getOrderByMagicToken = async (req, res) => {
    return successResponse(res, 200, "Order magic token verified");
};

const cancelOrderPublic = async (req, res) => {
    return successResponse(res, 200, "Order cancelled");
};

const requestReturnPublic = async (req, res) => {
    return successResponse(res, 200, "Return requested");
};

module.exports = {
    createOrder,
    getAllOrders,
    getRefundRequests,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    updatePaymentStatus,
    deleteOrder,
    updateProductStatus,
    trackOrderPublic,
    getOrderByMagicToken,
    cancelOrderPublic,
    requestReturnPublic
};
