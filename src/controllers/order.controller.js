const { create, findOne, findMany, findAndUpdate, deleteOne } = require('../services/mongodb/mongoService');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const { Order, PromoCode, Product, User } = require('../models/index');
const mongoose = require('mongoose');
const { cacheUtils } = require("../config/redis");
const { generateOrderNumber } = require("../utils/orderUtils");

// Create a new order
const createOrder = async (req, res) => {
    try {
        const { 
            products, 
            shippingAddress, 
            paymentMethod, 
            promoCode,
            deliveryNotes,
            giftWrap = false
        } = req.body;

        // Basic validation
        if (!products || !Array.isArray(products) || products.length === 0) {
            return errorResponse(res, 400, "Products array is required and cannot be empty");
        }
        
        if (!shippingAddress || !shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode) {
            return errorResponse(res, 400, "Complete shipping address is required");
        }
        
        if (!paymentMethod) {
            return errorResponse(res, 400, "Payment method is required");
        }
        
        // Check valid payment methods
        const validPaymentMethods = ['COD', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'WALLET', 'NET_BANKING'];
        if (!validPaymentMethods.includes(paymentMethod)) {
            return errorResponse(res, 400, `Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`);
        }

        // Validate user exists
        if (!req.user || !req.user.id) {
            return errorResponse(res, 401, "User authentication required");
        }
        
        const userExists = await User.exists({ _id: req.user.id, isBlocked: false, isDeleted: false });
        if (!userExists) {
            return errorResponse(res, 403, "User account is inactive or deleted");
        }

        // Fetch and validate product details from DB
        let productDetails = [];
        let outOfStockProducts = [];
        
        for (const p of products) {
            if (!p.productId || !p.quantity || p.quantity <= 0) {
                return errorResponse(res, 400, "Each product must have a valid productId and positive quantity");
            }
            
            if (!mongoose.Types.ObjectId.isValid(p.productId)) {
                return errorResponse(res, 400, `Invalid product ID format: ${p.productId}`);
            }
            
            const product = await Product.findOne({ 
                _id: p.productId, 
                isDeleted: false, 
                isBlocked: false 
            });
            
            if (!product) {
                return errorResponse(res, 404, `Product ${p.productId} not found or unavailable`);
            }
            
            // Check if product is in stock
            if (!product.isInStock || (product.stock !== undefined && product.stock < p.quantity)) {
                outOfStockProducts.push(product.name);
                continue;
            }
            
            const price = product.discountedPrice || product.actualPrice;
            
            productDetails.push({
                productId: new mongoose.Types.ObjectId(p.productId),
                name: product.name,
                price: price,
                actualPrice: product.actualPrice,
                discountedPrice: product.discountedPrice,
                quantity: p.quantity,
                subtotal: price * p.quantity,
                image: product.images && product.images.length > 0 ? product.images[0] : null,
                sku: product.sku,
                weight: product.weight,
                unit: product.unit || 'kg'
            });
        }
        
        if (outOfStockProducts.length > 0) {
            return errorResponse(res, 400, "Some products are out of stock", { outOfStockProducts });
        }
        
        if (productDetails.length === 0) {
            return errorResponse(res, 400, "No valid products in order");
        }

        // Calculate total amounts
        const subtotal = productDetails.reduce((sum, p) => sum + p.subtotal, 0);
        
        // Calculate shipping charge based on subtotal or product weight
        const totalWeight = productDetails.reduce((sum, p) => sum + (p.weight || 0) * p.quantity, 0);
        const shippingCharge = calculateShippingCharge(subtotal, totalWeight);
        
        const taxRate = 0.1; // 10% tax (should be configurable)
        const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));
        let discountAmount = 0;
        let promoCodeDetails = null;

        // Apply promo code discount if valid
        if (promoCode) {
            const promo = await PromoCode.findOne({
                _id: promoCode,
                isActive: true,
                expiryDate: { $gt: new Date() },
                minPurchaseAmount: { $lte: subtotal }
            });
            
            if (promo) {
                if (promo.discountType === 'PERCENTAGE') {
                    discountAmount = parseFloat(((subtotal * promo.discountValue) / 100).toFixed(2));
                    // Cap the discount if there's a maximum
                    if (promo.maxDiscountAmount && discountAmount > promo.maxDiscountAmount) {
                        discountAmount = promo.maxDiscountAmount;
                    }
                } else {
                    discountAmount = promo.discountValue;
                }
                
                promoCodeDetails = {
                    id: promo._id,
                    code: promo.code,
                    discountType: promo.discountType,
                    discountValue: promo.discountValue
                };
            } else {
                return errorResponse(res, 400, "Invalid or expired promo code");
            }
        }

        const finalAmount = parseFloat((subtotal - discountAmount + taxAmount + shippingCharge).toFixed(2));
        
        // Generate unique order number
        const orderNumber = await generateOrderNumber();

        const orderData = {
            orderNumber,
            userId: new mongoose.Types.ObjectId(req.user.id),
            products: productDetails,
            subtotal,
            shippingCharge,
            tax: taxRate * 100, // Storing tax rate as percentage
            taxAmount,
            discountAmount,
            finalAmount,
            promoCode: promoCodeDetails ? promoCodeDetails.id : null,
            promoCodeDetails,
            status: "Pending",
            shippingAddress,
            paymentMethod,
            paymentStatus: "Pending",
            deliveryNotes,
            giftWrap,
            estimatedDelivery: calculateEstimatedDelivery(),
            paymentDetails: {
                method: paymentMethod,
                status: "Pending",
                transactionId: null
            }
        };

        const order = await create(Order, orderData);
        
        // Update product stock
        for (const item of productDetails) {
            await Product.findByIdAndUpdate(
                item.productId,
                { 
                    $inc: { stock: -item.quantity },
                    $set: { isInStock: { $cond: [{ $gt: [{ $subtract: ["$stock", item.quantity] }, 0] }, true, false] } }
                }
            );
        }
        
        // Clear any related caches
        await cacheUtils.del(`user_orders_${req.user.id}`);
        await cacheUtils.delPattern('admin_orders_*');
        
        return successResponse(res, 201, "Order created successfully", { 
            order: {
                _id: order._id,
                orderNumber: order.orderNumber,
                finalAmount: order.finalAmount,
                status: order.status,
                paymentStatus: order.paymentStatus,
                estimatedDelivery: order.estimatedDelivery
            } 
        });

    } catch (error) {
        console.error("Create Order Error: ", error);
        return errorResponse(res, 500, error.message || "Failed to create order");
    }
};

// Get all orders (Admin only)
const getAllOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            status,
            paymentStatus,
            startDate,
            endDate,
            search
        } = req.query;
        
        // Create cache key
        const cacheKey = `admin_orders_${page}_${limit}_${sortBy}_${sortOrder}_${status || ''}_${paymentStatus || ''}_${startDate || ''}_${endDate || ''}_${search || ''}`;
        
        // Try to get from cache
        const cachedData = await cacheUtils.get(cacheKey);
        if (cachedData) {
            return successResponse(res, 200, "Orders retrieved successfully", cachedData);
        }
        
        // Build query
        const query = {};
        
        if (status) {
            query.status = status;
        }
        
        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }
        
        // Date filter
        if (startDate || endDate) {
            query.createdAt = {};
            
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            
            if (endDate) {
                // Set the end date to the end of the day
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                query.createdAt.$lte = endDateTime;
            }
        }
        
        // Search by order number or user information
        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } }
            ];
            
            // If it's a valid ObjectId, also search by userId
            if (mongoose.Types.ObjectId.isValid(search)) {
                query.$or.push({ userId: new mongoose.Types.ObjectId(search) });
            }
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        
        // Execute query with pagination
        const orders = await Order.find(query)
            .populate({ path: 'userId', select: 'name email phone' })
            .skip(skip)
            .limit(parseInt(limit))
            .sort(sortOptions)
            .lean();
        
        const total = await Order.countDocuments(query);
        
        const result = {
            orders,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        };
        
        // Cache the result for 2 minutes
        await cacheUtils.set(cacheKey, result, 120);
        
        return successResponse(res, 200, "Orders retrieved successfully", result);
    } catch (error) {
        console.error("Get All Orders Error:", error);
        return errorResponse(res, 500, error.message || "Failed to retrieve orders");
    }
};

// Get user's orders
const getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            page = 1,
            limit = 10,
            status,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;
        
        // Create cache key
        const cacheKey = `user_orders_${userId}_${page}_${limit}_${status || ''}_${sortBy}_${sortOrder}`;
        
        // Try to get from cache
        const cachedData = await cacheUtils.get(cacheKey);
        if (cachedData) {
            return successResponse(res, 200, "Orders retrieved successfully", cachedData);
        }
        
        // Build query
        const query = { userId: new mongoose.Types.ObjectId(userId) };
        
        if (status) {
            query.status = status;
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        
        // Execute query with pagination
        const orders = await Order.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .sort(sortOptions)
            .lean();
        
        const total = await Order.countDocuments(query);
        
        const result = {
            orders,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        };
        
        // Cache the result for 5 minutes
        await cacheUtils.set(cacheKey, result, 300);
        
        return successResponse(res, 200, "Orders retrieved successfully", result);
    } catch (error) {
        console.error("Get User Orders Error:", error);
        return errorResponse(res, 500, error.message || "Failed to retrieve orders");
    }
};

// Get order by ID
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, 400, "Invalid order ID format");
        }
        
        // Check if admin or order owner
        const isAdmin = req.user.role === 'Admin';
        const userId = req.user.id;
        
        // Create cache key
        const cacheKey = `order_${id}_${isAdmin ? 'admin' : userId}`;
        
        // Try to get from cache
        const cachedOrder = await cacheUtils.get(cacheKey);
        if (cachedOrder) {
            return successResponse(res, 200, "Order retrieved successfully", { order: cachedOrder });
        }
        
        // Build query based on user role
        const query = { _id: id };
        if (!isAdmin) {
            query.userId = new mongoose.Types.ObjectId(userId);
        }
        
        // Get order with populated fields
        const order = await Order.findOne(query)
            .populate({ path: 'userId', select: 'name email phone' })
            .lean();
        
        if (!order) {
            return errorResponse(res, 404, "Order not found");
        }
        
        // Cache for 10 minutes
        await cacheUtils.set(cacheKey, order, 600);
        
        return successResponse(res, 200, "Order retrieved successfully", { order });
    } catch (error) {
        console.error("Get Order Error:", error);
        return errorResponse(res, 500, error.message || "Failed to retrieve order");
    }
};

// Update order status (Admin only)
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, trackingId, trackingURL, deliveryPartner, notes } = req.body;
        
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, 400, "Invalid order ID format");
        }
        
        if (!status) {
            return errorResponse(res, 400, "Status is required");
        }
        
        // Validate status
        const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Refunded'];
        if (!validStatuses.includes(status)) {
            return errorResponse(res, 400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
        
        // Get the existing order
        const existingOrder = await Order.findById(id);
        if (!existingOrder) {
            return errorResponse(res, 404, "Order not found");
        }
        
        // Build update data
        const updateData = { 
            status
        };
        
        // Add tracking info if provided
        if (status === 'Shipped') {
            if (!trackingId) {
                return errorResponse(res, 400, "Tracking ID is required for 'Shipped' status");
            }
            
            updateData.trackingInfo = {
                trackingId,
                trackingURL: trackingURL || '',
                deliveryPartner: deliveryPartner || '',
                shippedAt: new Date()
            };
            
            // Update estimated delivery based on shipping date
            updateData.estimatedDelivery = calculateEstimatedDelivery(new Date());
        }
        
        if (status === 'Delivered') {
            updateData.deliveredAt = new Date();
        }
        
        const statusHistory = {
            status,
            timestamp: new Date(),
            notes: notes || ''
        };
        
        // Add the new status to history
        const order = await Order.findByIdAndUpdate(
            id,
            { 
                $set: updateData,
                $push: { statusHistory }
            },
            { new: true }
        );
        
        // Clear order cache
        await cacheUtils.delPattern(`order_${id}_*`);
        await cacheUtils.delPattern('admin_orders_*');
        await cacheUtils.delPattern(`user_orders_${order.userId}_*`);
        
        return successResponse(res, 200, "Order status updated successfully", { order });
    } catch (error) {
        console.error("Update Order Status Error:", error);
        return errorResponse(res, 500, error.message || "Failed to update order status");
    }
};

// Cancel order (User only)
const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, 400, "Invalid order ID format");
        }
        
        // Find the order
        const order = await Order.findOne({ 
            _id: id, 
            userId: new mongoose.Types.ObjectId(req.user.id) 
        });
        
        if (!order) {
            return errorResponse(res, 404, "Order not found");
        }
        
        // Check if order can be cancelled
        if (['Shipped', 'Delivered', 'Cancelled', 'Returned', 'Refunded'].includes(order.status)) {
            return errorResponse(res, 400, `Cannot cancel order in ${order.status} status`);
        }
        
        // Update order status
        order.status = "Cancelled";
        order.cancelDetails = {
            cancelledAt: new Date(),
            reason: reason || 'Customer cancelled',
            cancelledBy: 'User'
        };
        
        // Add to status history
        order.statusHistory.push({
            status: 'Cancelled',
            timestamp: new Date(),
            notes: reason || 'Customer cancelled'
        });
        
        // If payment was made, mark for refund
        if (order.paymentStatus === 'Paid') {
            order.refundStatus = 'Pending';
        }
        
        await order.save();
        
        // Restore product stock
        for (const item of order.products) {
            await Product.findByIdAndUpdate(
                item.productId,
                { 
                    $inc: { stock: item.quantity },
                    $set: { isInStock: true }
                }
            );
        }
        
        // Clear order cache
        await cacheUtils.delPattern(`order_${id}_*`);
        await cacheUtils.delPattern('admin_orders_*');
        await cacheUtils.delPattern(`user_orders_${order.userId}_*`);
        
        return successResponse(res, 200, "Order cancelled successfully", { order });
    } catch (error) {
        console.error("Cancel Order Error:", error);
        return errorResponse(res, 500, error.message || "Failed to cancel order");
    }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus, transactionId, paymentDetails } = req.body;
        
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, 400, "Invalid order ID format");
        }
        
        if (!paymentStatus) {
            return errorResponse(res, 400, "Payment status is required");
        }
        
        // Validate status
        const validStatuses = ['Pending', 'Paid', 'Failed', 'Refunded', 'Partially Refunded'];
        if (!validStatuses.includes(paymentStatus)) {
            return errorResponse(res, 400, `Invalid payment status. Must be one of: ${validStatuses.join(', ')}`);
        }
        
        // Get the existing order
        const order = await Order.findById(id);
        if (!order) {
            return errorResponse(res, 404, "Order not found");
        }
        
        // Update payment status and details
        order.paymentStatus = paymentStatus;
        
        if (!order.paymentDetails) {
            order.paymentDetails = {};
        }
        
        order.paymentDetails.status = paymentStatus;
        
        if (transactionId) {
            order.paymentDetails.transactionId = transactionId;
        }
        
        if (paymentDetails) {
            Object.assign(order.paymentDetails, paymentDetails);
        }
        
        // Update order status based on payment status
        if (paymentStatus === 'Paid' && order.status === 'Pending') {
            order.status = 'Processing';
            
            // Add to status history
            order.statusHistory.push({
                status: 'Processing',
                timestamp: new Date(),
                notes: 'Payment received'
            });
        } else if (paymentStatus === 'Failed' && order.status === 'Pending') {
            order.status = 'Cancelled';
            
            // Add to status history
            order.statusHistory.push({
                status: 'Cancelled',
                timestamp: new Date(),
                notes: 'Payment failed'
            });
            
            // Restore product stock
            for (const item of order.products) {
                await Product.findByIdAndUpdate(
                    item.productId,
                    { 
                        $inc: { stock: item.quantity },
                        $set: { isInStock: true }
                    }
                );
            }
        } else if (paymentStatus === 'Refunded' && ['Cancelled', 'Returned'].includes(order.status)) {
            // Add refund timestamp
            order.refundDetails = {
                refundedAt: new Date(),
                refundAmount: order.finalAmount,
                refundTransactionId: transactionId || null
            };
        }
        
        await order.save();
        
        // Clear order cache
        await cacheUtils.delPattern(`order_${id}_*`);
        await cacheUtils.delPattern('admin_orders_*');
        await cacheUtils.delPattern(`user_orders_${order.userId}_*`);
        
        return successResponse(res, 200, "Payment status updated successfully", { order });
    } catch (error) {
        console.error("Update Payment Status Error:", error);
        return errorResponse(res, 500, error.message || "Failed to update payment status");
    }
};

// Delete order (Admin only - soft delete)
const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, 400, "Invalid order ID format");
        }
        
        const order = await Order.findByIdAndUpdate(
            id,
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );
        
        if (!order) {
            return errorResponse(res, 404, "Order not found");
        }
        
        // Clear order cache
        await cacheUtils.delPattern(`order_${id}_*`);
        await cacheUtils.delPattern('admin_orders_*');
        await cacheUtils.delPattern(`user_orders_${order.userId}_*`);
        
        return successResponse(res, 200, "Order deleted successfully");
    } catch (error) {
        console.error("Delete Order Error:", error);
        return errorResponse(res, 500, error.message || "Failed to delete order");
    }
};

// Helper functions
function calculateShippingCharge(subtotal, weight) {
    // Base shipping is free for orders above 1000
    if (subtotal >= 1000) return 0;
    
    // For smaller orders, calculate based on weight
    // Base charge
    let charge = 50;
    
    // Add weight-based charge for items over 5kg
    if (weight > 5) {
        charge += Math.ceil(weight - 5) * 10;
    }
    
    return charge;
}

function calculateEstimatedDelivery(fromDate = new Date()) {
    // Default delivery estimate is 3-7 days from current date
    const minDays = 3;
    const maxDays = 7;
    
    // Calculate a date between min and max days from now
    const deliveryDate = new Date(fromDate);
    deliveryDate.setDate(deliveryDate.getDate() + maxDays);
    
    return deliveryDate;
}

module.exports = {
    createOrder,
    getAllOrders,
    getUserOrders,
    getOrderById,
    updateOrderStatus,
    cancelOrder,
    updatePaymentStatus,
    deleteOrder
};
