const { create, findOne, findMany, findAndUpdate, deleteOne } = require('../services/mongodb/mongoService');
const { successResponse, errorResponse } = require("../utils/responseUtil");
const { Order, PromoCode, Product, User } = require('../models/index');
const { createAdminOrderNotifications } = require('../services/notifications/notification.service');
const mongoose = require('mongoose');
const { cacheUtils } = require("../config/redis");
const { generateOrderNumber } = require("../utils/orderUtils");
const { sendEmail } = require("../services/notifications/email.service");
const jwt = require("jsonwebtoken");
const Razorpay = require("razorpay");


const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createOrder = async (req, res) => {
    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);

    try {
        const {
            products,
            shippingAddress,
            billingAddress,
            paymentMethod,
            promoCode,
            deliveryNotes,
            giftWrap = false,
            giftMessage
        } = req.body;

        // Basic validation
        if (!products || !Array.isArray(products) || products.length === 0) {
            return errorResponse(res, 400, "Products array is required and cannot be empty");
        }

        if (!paymentMethod) {
            return errorResponse(res, 400, "Payment method is required");
        }

        // Check valid payment methods
        const validPaymentMethods = ['COD', "ONLINE", 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'WALLET', 'PAYPAL'];
        if (!validPaymentMethods.includes(paymentMethod)) {
            return errorResponse(res, 400, `Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`);
        }

        // Validate shipping address
        if (!shippingAddress || !shippingAddress.addressLine1 || !shippingAddress.city ||
            !shippingAddress.state || !shippingAddress.postalCode ||
            !shippingAddress.contactName || !shippingAddress.contactPhone) {
            return errorResponse(res, 400, "Complete shipping address with contact information is required");
        }

        // User authentication is now optional for guest checkout
        const userId = req.user ? req.user._id : null;
        const guestEmail = req.body.guestEmail || null;
        const guestPhone = req.body.guestPhone || shippingAddress?.contactPhone || null;

        if (!userId) {
            if (!guestEmail) {
                return errorResponse(res, 400, "Email is required to place an order");
            }
            if (!guestPhone) {
                return errorResponse(res, 400, "Phone number is required to place an order");
            }
        }

        // Fetch and validate product details from DB
        let productDetails = [];
        let outOfStockProducts = [];
        let unavailableProducts = [];

        for (const p of products) {
            if (!p.productId || !p.quantity || p.quantity <= 0) {
                return errorResponse(res, 400, "Each product must have a valid productId and positive quantity");
            }

            if (!mongoose.Types.ObjectId.isValid(p.productId)) {
                return errorResponse(res, 400, `Invalid product ID format: ${p.productId}`);
            }

            const product = await Product.findOne({
                _id: p.productId,
                isDeleted: { $ne: true },
                isBlocked: { $ne: true }
            }).populate("priceRuleId", "price");

            if (!product) {
                unavailableProducts.push(p.productId);
                continue;
            }

            // Check if product is in stock
            if ((product.isInStock === false) || (product.stock !== undefined && product.stock < p.quantity)) {
                outOfStockProducts.push({
                    id: product._id,
                    name: product.name,
                    available: product.stock || 0,
                    requested: p.quantity
                });
                continue;
            }

            // Dynamic Price Calculation
            let actualPrice = product.actualPrice;
            if (!product.isPriceFixed && product.priceRuleId && product.priceRuleId.price) {
                const liveRate = product.priceRuleId.price;
                const weight = product.weight || 0;
                const making = product.makingCharges || 0;
                actualPrice = (liveRate * weight) + making;
            }

            // Calculate active price based on dynamic actualPrice
            let price = actualPrice;
            let discountedPrice = product.discountedPrice;
            
            // If there's a discountedPrice stored in DB AND it's less than actual price, we honor it.
            // A more robust system would re-apply the discount percentage to the dynamic price.
            if (discountedPrice && discountedPrice < actualPrice) {
                 price = discountedPrice;
            } else {
                 discountedPrice = null; // reset if invalid
            }

            productDetails.push({
                productId: product._id,
                name: product.name,
                slug: product.slug,
                price: price,
                actualPrice: actualPrice,
                discountedPrice: discountedPrice,
                quantity: p.quantity,
                subtotal: parseFloat((price * p.quantity).toFixed(2)),
                image: product.images && product.images.length > 0 ? product.images[0] : null,
                sku: product.sku,
                weight: product.weight || 0,
                unit: product.unit || 'kg',
                expectedDeliveryDate: expectedDeliveryDate
            });
        }

        // Report any issues with products
        if (unavailableProducts.length > 0) {
            return errorResponse(res, 404, "Some products are unavailable or have been removed", { unavailableProducts });
        }

        if (outOfStockProducts.length > 0) {
            return errorResponse(res, 400, "Some products are out of stock or have insufficient quantity", { outOfStockProducts });
        }

        if (productDetails.length === 0) {
            return errorResponse(res, 400, "No valid products in order");
        }

        const subtotal = parseFloat(productDetails.reduce((sum, p) => sum + p.subtotal, 0).toFixed(2));

        const totalWeight = productDetails.reduce((sum, p) => sum + (p.weight || 0) * p.quantity, 0);
        const shippingCharge = calculateShippingCharge(subtotal, totalWeight);

        const taxRate = 0.18; // 18% GST (should be configurable)
        const taxAmount = parseFloat((subtotal * taxRate).toFixed(2));

        let discountAmount = 0;
        let promoCodeDetails = null;
        let promoDoc = null;

        // Apply promo code discount if valid (accept either code string or Mongo _id)
        if (promoCode) {
            const isObjectId = mongoose.Types.ObjectId.isValid(promoCode) && String(new mongoose.Types.ObjectId(promoCode)) === promoCode;
            const query = isObjectId
                ? { _id: promoCode, status: 'active', endDate: { $gt: new Date() }, isDeleted: { $ne: true } }
                : { code: String(promoCode).toUpperCase(), status: 'active', endDate: { $gt: new Date() }, isDeleted: { $ne: true } };
            promoDoc = await PromoCode.findOne(query);

            if (promoDoc) {
                if (promoDoc.minPurchase && subtotal < promoDoc.minPurchase) {
                    return errorResponse(res, 400, `Minimum order value for this promo is ₹${promoDoc.minPurchase}`);
                }
                if (promoDoc.usageLimit != null && (promoDoc.usedCount || 0) >= promoDoc.usageLimit) {
                    return errorResponse(res, 400, "This promo code has reached its usage limit");
                }
                if (userId && promoDoc.usedBy && promoDoc.usedBy.some(id => id && id.toString() === userId.toString())) {
                    return errorResponse(res, 400, "You have already used this promo code");
                }

                const typeLower = (promoDoc.type || '').toLowerCase();
                if (typeLower === 'percentage') {
                    discountAmount = parseFloat(((subtotal * promoDoc.value) / 100).toFixed(2));
                    if (promoDoc.maxDiscount != null && discountAmount > promoDoc.maxDiscount) {
                        discountAmount = parseFloat(Number(promoDoc.maxDiscount).toFixed(2));
                    }
                } else {
                    discountAmount = Math.min(parseFloat(Number(promoDoc.value).toFixed(2)), subtotal);
                }

                promoCodeDetails = {
                    code: promoDoc.code,
                    discountType: typeLower === 'percentage' ? 'PERCENTAGE' : 'FIXED',
                    discountValue: promoDoc.value
                };
            } else {
                return errorResponse(res, 400, "Invalid or expired promo code");
            }
        }

        const totalAmount = parseFloat((subtotal + taxAmount + shippingCharge).toFixed(2));
        const finalAmount = parseFloat((totalAmount - discountAmount).toFixed(2));

        let advanceAmount = 0;
        let pendingAmount = 0;
        if (paymentMethod === 'COD') {
            // COD: collect 20% advance online, rest on delivery
            advanceAmount = parseFloat((finalAmount * 0.20).toFixed(2));
            pendingAmount = parseFloat((finalAmount - advanceAmount).toFixed(2));
        } else {
            advanceAmount = finalAmount;
        }

        const finalBillingAddress = billingAddress || shippingAddress;

        const orderNumber = await generateOrderNumber();

        const orderData = {
            orderNumber,
            userId,
            guestEmail,
            guestPhone,
            products: productDetails,
            subtotal,
            totalAmount,
            shippingCharge,
            tax: taxRate * 100, // Storing tax rate as percentage
            taxAmount,
            discountAmount,
            finalAmount,
            advanceAmount,
            pendingAmount,
            promoCode: promoDoc ? promoDoc._id : null,
            promoCodeDetails,
            status: "Pending",
            shippingAddress,
            billingAddress: finalBillingAddress,
            paymentMethod,
            paymentStatus: "Pending",
            deliveryNotes,
            giftWrap,
            giftMessage,
            estimatedDelivery: calculateEstimatedDelivery(),
            paymentDetails: {
                method: paymentMethod,
                status: "Pending",
            },
            statusHistory: [{
                status: "Pending",
                timestamp: new Date(),
                notes: "Order created"
            }]
        };

        const order = await create(Order, orderData);

        // Update promo code usage so it reflects in admin panel
        if (promoDoc && order._id) {
            try {
                promoDoc.usedCount = (promoDoc.usedCount || 0) + 1;
                promoDoc.usageCount = (promoDoc.usageCount || 0) + 1;
                if (userId && promoDoc.usedBy) {
                    if (!promoDoc.usedBy.some(id => id && id.toString() === userId.toString())) {
                        promoDoc.usedBy.push(userId);
                    }
                } else if (userId) {
                    promoDoc.usedBy = promoDoc.usedBy || [];
                    if (!promoDoc.usedBy.some(id => id && id.toString() === userId.toString())) {
                        promoDoc.usedBy.push(userId);
                    }
                }
                await promoDoc.save();
            } catch (e) {
                console.error("Failed to update promo usage:", e);
            }
        }

        /* --------------------------------------------------
           🚀 ADDED RAZORPAY ORDER CREATION (ONLY THIS PART)
        -------------------------------------------------- */
        if (paymentMethod === "ONLINE" || paymentMethod === "UPI" || paymentMethod === "COD") {
            const razorpayOrder = await razorpayInstance.orders.create({
                amount: Math.round(order.advanceAmount * 100),
                currency: "INR",
                receipt: `order_${order._id}`,
                notes: {
                    orderId: order._id.toString(),
                    userId: userId ? userId.toString() : 'guest'
                }
            });

            order.razorpayOrderId = razorpayOrder.id;
            await order.save();
        }
        /* -------------------------------------------------- */

        // Send order confirmation email with magic link / tracking link
        try {
            // Determine customer email & phone (supporting both guest and logged-in user)
            let customerEmail = guestEmail;
            let customerPhone = guestPhone;

            if (userId && !customerEmail) {
                const user = await User.findById(userId).select("email phone name");
                if (user) {
                    customerEmail = user.email;
                    if (!customerPhone && user.phone) {
                        customerPhone = user.phone;
                    }
                }
            }

            if (customerEmail) {
                const webBaseUrl = process.env.WEB_BASE_URL || "https://yourwebsite.com";

                // Create a magic JWT token so user can open order directly from email
                const magicToken = jwt.sign(
                    {
                        type: "ORDER_MAGIC",
                        orderId: order._id.toString(),
                        orderNumber: order.orderNumber,
                        phone: customerPhone || guestPhone || shippingAddress?.contactPhone || null,
                    },
                    process.env.JWT_SECRET_KEY,
                    { expiresIn: "30d" }
                );

                const trackUrl = `${webBaseUrl}/order/${order.orderNumber}?token=${magicToken}`;
                const trackPageUrl = `${webBaseUrl}/track-order`;

                const discountLine = order.discountAmount > 0 && order.promoCodeDetails
                    ? `<p>Discount applied: <strong>${order.promoCodeDetails.code}</strong> (−₹${order.discountAmount.toFixed(2)})</p>`
                    : '';
                const html = `
                  <p>Hi ${shippingAddress?.contactName || "Customer"},</p>
                  <p>Your order <strong>${order.orderNumber}</strong> has been placed successfully.</p>
                  ${discountLine}
                  <p>Track your order directly here:</p>
                  <p><a href="${trackUrl}">${trackUrl}</a></p>
                  <p>Or visit the Track Order page and enter your Order ID <strong>${order.orderNumber}</strong> and your phone number:</p>
                  <p><a href="${trackPageUrl}">${trackPageUrl}</a></p>
                  <p>Thank you for shopping with us.</p>
                `;

                await sendEmail(customerEmail, "Order Confirmed", html);
            }
        } catch (emailError) {
            console.error("Order confirmation email failed:", emailError);
        }

        try {
            if (userId) {
                await cacheUtils.del(`user_orders_${userId}`);
            }
            await cacheUtils.delPattern('admin_orders_*');
        } catch (cacheError) {
            console.error("Error clearing cache:", cacheError);
        }

        // Fire-and-forget admin notification for new order
        createAdminOrderNotifications('NEW_ORDER', order).catch(e => console.error('NEW_ORDER notification error:', e));

        return successResponse(res, 201, "Order created successfully", {
            order: {
                _id: order._id,
                orderNumber: order.orderNumber,
                subtotal: order.subtotal,
                shippingCharge: order.shippingCharge,
                taxAmount: order.taxAmount,
                discountAmount: order.discountAmount,
                finalAmount: order.finalAmount,
                advanceAmount: order.advanceAmount,
                pendingAmount: order.pendingAmount,
                status: order.status,
                paymentStatus: order.paymentStatus,
                estimatedDelivery: order.estimatedDelivery,
                paymentMethod: order.paymentMethod,
                createdAt: order.createdAt,
                razorpayOrderId: order.razorpayOrderId || null
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

const getRefundRequests = async (req, res) => {
    try {
        let {
            page = 1,
            limit = 10,
            refundStatus = 'ALL',
            sort = 'createdAt:desc',
            search
        } = req.query;

        const allowedRefundStatuses = ['ALL', 'REFUNDED', 'PROCESSING', 'PENDING'];
        refundStatus = typeof refundStatus === 'string' ? refundStatus.toUpperCase() : 'ALL';
        if (!allowedRefundStatuses.includes(refundStatus)) {
            return errorResponse(res, 400, `Invalid refund status. Must be one of: ${allowedRefundStatuses.join(', ')}`);
        }

        const allowedSortOptions = {
            'createdAt:desc': { createdAt: -1 },
            'createdAt:asc': { createdAt: 1 },
            'finalAmount:desc': { finalAmount: -1 },
            'finalAmount:asc': { finalAmount: 1 }
        };

        if (!allowedSortOptions[sort]) {
            sort = 'createdAt:desc';
        }

        page = Math.max(parseInt(page, 10) || 1, 1);
        limit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

        const baseQuery = {
            isDeleted: { $ne: true },
            $or: [
                { status: { $in: ['Cancelled', 'Returned', 'Refunded'] } },
                { paymentStatus: { $in: ['Refunded', 'Partially Refunded'] } },
                { 'refundDetails.refundStatus': { $exists: true } }
            ]
        };

        const refundStatusConditions = {
            REFUNDED: {
                $or: [
                    { paymentStatus: 'Refunded' },
                    { status: 'Refunded' },
                    { 'refundDetails.refundStatus': 'Completed' }
                ]
            },
            PROCESSING: {
                $or: [
                    { 'refundDetails.refundStatus': { $in: ['Processed', 'Processing'] } },
                    { paymentStatus: 'Partially Refunded' }
                ]
            },
            PENDING: {
                $or: [
                    { 'refundDetails.refundStatus': { $in: ['Pending'] } },
                    {
                        $and: [
                            { paymentStatus: 'Paid' },
                            { status: { $in: ['Cancelled', 'Returned'] } },
                            { 'refundDetails.refundStatus': { $exists: false } }
                        ]
                    }
                ]
            }
        };

        if (refundStatus !== 'ALL') {
            baseQuery.$and = baseQuery.$and || [];
            baseQuery.$and.push(refundStatusConditions[refundStatus]);
        }

        if (search) {
            const searchConditions = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'refundDetails.refundTransactionId': { $regex: search, $options: 'i' } }
            ];

            if (mongoose.Types.ObjectId.isValid(search)) {
                searchConditions.push({ userId: new mongoose.Types.ObjectId(search) });
            }

            baseQuery.$and = baseQuery.$and || [];
            baseQuery.$and.push({ $or: searchConditions });
        }

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(baseQuery)
                .populate({ path: 'userId', select: 'name email phone' })
                .sort(allowedSortOptions[sort])
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(baseQuery)
        ]);

        return successResponse(res, 200, "Refund requests retrieved successfully", {
            orders,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Get Refund Requests Error:", error);
        return errorResponse(res, 500, error.message || "Failed to retrieve refund requests");
    }
};

// Helpers for public tracking / magic link
function computeOrderActionFlags(order) {
    const nonCancellableStatuses = ['Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned', 'Refunded'];
    const canCancel = !nonCancellableStatuses.includes(order.status);

    let canReturn = false;
    if (order.status === 'Delivered' && order.deliveredAt) {
        const diffDays = (Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
        canReturn = diffDays <= 7;
    }

    return { canCancel, canReturn };
}

// Track order by orderNumber + phone (guest or logged-in)
const trackOrderPublic = async (req, res) => {
    try {
        const { orderNumber, phone } = req.body || {};

        if (!orderNumber || !phone) {
            return errorResponse(res, 400, "Order number and phone are required");
        }

        const normalizedPhone = String(phone).trim();

        const order = await Order.findOne({
            orderNumber,
            guestPhone: normalizedPhone
        }).lean();

        if (!order) {
            return errorResponse(res, 404, "Order not found");
        }

        const { canCancel, canReturn } = computeOrderActionFlags(order);

        return successResponse(res, 200, "Order retrieved successfully", {
            order: {
                _id: order._id,
                orderNumber: order.orderNumber,
                status: order.status,
                products: order.products,
                finalAmount: order.finalAmount,
                shippingAddress: order.shippingAddress,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                estimatedDelivery: order.estimatedDelivery,
                deliveredAt: order.deliveredAt,
                statusHistory: order.statusHistory,
                createdAt: order.createdAt,
            },
            canCancel,
            canReturn
        });
    } catch (error) {
        console.error("Track Order Public Error:", error);
        return errorResponse(res, 500, error.message || "Failed to track order");
    }
};

// Get order using magic token from email
const getOrderByMagicToken = async (req, res) => {
    try {
        const { token } = req.body || {};

        if (!token) {
            return errorResponse(res, 400, "Token is required");
        }

        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET_KEY);
        } catch (err) {
            return errorResponse(res, 400, "Invalid or expired link");
        }

        if (!payload || payload.type !== "ORDER_MAGIC" || !payload.orderId) {
            return errorResponse(res, 400, "Invalid link payload");
        }

        const order = await Order.findById(payload.orderId).lean();
        if (!order) {
            return errorResponse(res, 404, "Order not found");
        }

        const { canCancel, canReturn } = computeOrderActionFlags(order);

        return successResponse(res, 200, "Order retrieved successfully", {
            order: {
                _id: order._id,
                orderNumber: order.orderNumber,
                status: order.status,
                products: order.products,
                finalAmount: order.finalAmount,
                shippingAddress: order.shippingAddress,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                estimatedDelivery: order.estimatedDelivery,
                deliveredAt: order.deliveredAt,
                statusHistory: order.statusHistory,
                createdAt: order.createdAt,
            },
            canCancel,
            canReturn
        });
    } catch (error) {
        console.error("Get Order By Magic Token Error:", error);
        return errorResponse(res, 500, error.message || "Failed to fetch order");
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
        const { id, productId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return errorResponse(res, 400, "Invalid order ID format");
        }

        const isAdmin = req.user.role === "Admin";
        const userId = req.user.id;

        const query = {
            _id: id,
            "products.productId": new mongoose.Types.ObjectId(productId)
        };

        if (!isAdmin) query.userId = userId;

        // fetch only the matched product + minimal order info
        const order = await Order.findOne(query, {
            _id: 1,
            status: 1,
            orderNumber: 1,
            createdAt: 1,
            products: { $elemMatch: { productId: new mongoose.Types.ObjectId(productId) } }
        }).lean();

        if (!order) {
            return errorResponse(res, 404, "Order / Product Not Found");
        }

        return successResponse(res, 200, "Product Retrieved Successfully", {
            order,
            product: order.products[0]
        });

    } catch (error) {
        console.error(error);
        return errorResponse(res, 500, error.message || "Failed to retrieve product");
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
   const validStatuses = [
  'Pending',
  'Processing',
  'Confirmed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Returned',
  'Refunded'
];

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

        // Notifications for specific status changes
        const typeMap = { Cancelled: 'ORDER_CANCELLED', Returned: 'ORDER_RETURNED', Refunded: 'ORDER_REFUNDED' };
        if (typeMap[status]) {
            createAdminOrderNotifications(typeMap[status],order).catch(e => console.error(`${status} notification error:`, e));
        }

        return successResponse(res, 200, "Order status updated successfully", { order });
    } catch (error) {
        console.error("Update Order Status Error:", error);
        return errorResponse(res, 500, error.message || "Failed to update order status");
    }
};
const updateProductStatus = async (req, res) => {
    try {
        const { orderId, productId } = req.params;
        const { status } = req.body;

        const validStatuses = [ 'Pending',
  'Processing',
  'Confirmed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Returned',
  'Refunded'];
        if (!validStatuses.includes(status)) {
          return errorResponse(res, 400, "Invalid status");
        }

        const order = await Order.findOneAndUpdate(
            { _id: orderId, "products._id": productId },
            {
                $set: { "products.$.status": status },
                $push: {
                    statusHistory: {
                        status: `${status} (Product: ${productId})`,
                        timestamp: new Date(),
                    }
                }
            },
            { new: true }
        ).populate("userId");

        if (!order) return errorResponse(res, 404, "Order or product not found");

        // // After update → Send Email to User
        // await sendMail(order.userId.email, `Product Status Update`, `
        //   Hello ${order.userId.name},

        //   Your product with ID: ${productId} is now marked as "${status}".

        //   Regards,
        //   Guru Jewellers Team
        // `);

        return successResponse(res, 200, "Product status updated successfully", { order });
    } catch (e) {
        console.log(e)
        return errorResponse(res, 500, "Failed to update product status");
    }
}

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

        createAdminOrderNotifications('ORDER_CANCELLED', order).catch(e => console.error('ORDER_CANCELLED notification error:', e));

        return successResponse(res, 200, "Order cancelled successfully", { order });
    } catch (error) {
        console.error("Cancel Order Error:", error);
        return errorResponse(res, 500, error.message || "Failed to cancel order");
    }
};

// Cancel order from public Track Order page (by orderNumber + phone)
const cancelOrderPublic = async (req, res) => {
    try {
        const { orderNumber, phone, reason } = req.body || {};

        if (!orderNumber || !phone) {
            return errorResponse(res, 400, "Order number and phone are required");
        }

        const normalizedPhone = String(phone).trim();

        const order = await Order.findOne({
            orderNumber,
            guestPhone: normalizedPhone
        });

        if (!order) {
            return errorResponse(res, 404, "Order not found");
        }

        // Allow cancel only in Pending or Confirmed (per requirement)
        if (!['Pending', 'Confirmed'].includes(order.status)) {
            return errorResponse(res, 400, `Cannot cancel order in ${order.status} status`);
        }

        order.status = "Cancelled";
        order.cancelDetails = {
            cancelledAt: new Date(),
            reason: reason || 'Customer cancelled from track page',
            cancelledBy: 'User'
        };

        order.statusHistory.push({
            status: 'Cancelled',
            timestamp: new Date(),
            notes: reason || 'Customer cancelled from track page'
        });

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

        await cacheUtils.delPattern(`order_${order._id}_*`);
        await cacheUtils.delPattern('admin_orders_*');
        if (order.userId) {
            await cacheUtils.delPattern(`user_orders_${order.userId}_*`);
        }

        createAdminOrderNotifications('ORDER_CANCELLED', order).catch(e => console.error('ORDER_CANCELLED notification error:', e));

        return successResponse(res, 200, "Order cancelled successfully", { order });
    } catch (error) {
        console.error("Cancel Order Public Error:", error);
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

        if (paymentStatus === 'Refunded') {
            createAdminOrderNotifications({
                type: 'ORDER_REFUNDED',
                orderId: order._id,
                userId: order.userId,
                orderNumber: order.orderNumber,
                amount: order.finalAmount
            }).catch(e => console.error('ORDER_REFUNDED notification error:', e));
        }

        return successResponse(res, 200, "Payment status updated successfully", { order });
    } catch (error) {
        console.error("Update Payment Status Error:", error);
        return errorResponse(res, 500, error.message || "Failed to update payment status");
    }
};

// Request return from public Track Order page (Delivered within 7 days)
const requestReturnPublic = async (req, res) => {
    try {
        const { orderNumber, phone, reason } = req.body || {};

        if (!orderNumber || !phone) {
            return errorResponse(res, 400, "Order number and phone are required");
        }

        const normalizedPhone = String(phone).trim();

        const order = await Order.findOne({
            orderNumber,
            guestPhone: normalizedPhone
        });

        if (!order) {
            return errorResponse(res, 404, "Order not found");
        }

        // Allow return only when Delivered and within 7 days
        if (order.status !== 'Delivered' || !order.deliveredAt) {
            return errorResponse(res, 400, "Return is allowed only for delivered orders");
        }

        const diffDays = (Date.now() - new Date(order.deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 7) {
            return errorResponse(res, 400, "Return window (7 days) has expired");
        }

        order.status = 'Returned';
        order.returnDetails = {
            returnedAt: new Date(),
            reason: reason || 'Customer requested return from track page',
            returnInitiatedBy: 'User'
        };

        order.statusHistory.push({
            status: 'Returned',
            timestamp: new Date(),
            notes: reason || 'Customer requested return from track page'
        });

        await order.save();

        await cacheUtils.delPattern(`order_${order._id}_*`);
        await cacheUtils.delPattern('admin_orders_*');
        if (order.userId) {
            await cacheUtils.delPattern(`user_orders_${order.userId}_*`);
        }

        createAdminOrderNotifications('ORDER_RETURNED', order).catch(e => console.error('ORDER_RETURNED notification error:', e));

        return successResponse(res, 200, "Return requested successfully", { order });
    } catch (error) {
        console.error("Request Return Public Error:", error);
        return errorResponse(res, 500, error.message || "Failed to request return");
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
