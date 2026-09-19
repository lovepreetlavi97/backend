"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
let OrdersService = class OrdersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createOrder(dto) {
        const rawItems = dto.items || dto.products || [];
        const normalizedItems = rawItems
            .map((i) => ({
            productId: (i.productId || i.id || i._id || '').trim(),
            quantity: Math.max(1, Number(i.quantity) || 1),
        }))
            .filter((i) => i.productId.length > 0);
        if (normalizedItems.length === 0) {
            throw new common_1.BadRequestException('Order items cannot be empty.');
        }
        const productIds = normalizedItems.map((i) => i.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
            include: { metal: true, priceRule: true },
        });
        const productMap = new Map(products.map((p) => [p.id, p]));
        let calculatedTotalPaise = 0;
        const validatedItems = [];
        const vendorItemsMap = new Map();
        for (const item of normalizedItems) {
            const product = productMap.get(item.productId);
            if (!product || product.isDeleted || !product.isPublished) {
                throw new common_1.NotFoundException(`Product ID '${item.productId}' not available.`);
            }
            const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 6500;
            const makingCharge = product.priceRule ? Number(product.priceRule.makingChargeGram) : 450;
            const gstPercent = product.priceRule ? Number(product.priceRule.gstPercentage) : 3.0;
            const rawPrice = Number(product.weightGrams) * ratePerGram + Number(product.weightGrams) * makingCharge;
            const unitPrice = rawPrice * (1 + gstPercent / 100);
            const unitPricePaise = Math.round(unitPrice * 100);
            const itemTotalPaise = unitPricePaise * item.quantity;
            calculatedTotalPaise += itemTotalPaise;
            const itemDetail = {
                productId: product.id,
                title: product.title,
                sku: product.sku,
                quantity: item.quantity,
                unitPrice: unitPricePaise / 100,
                itemTotal: itemTotalPaise / 100,
                vendorId: product.vendorId || null,
            };
            validatedItems.push(itemDetail);
            if (product.vendorId) {
                if (!vendorItemsMap.has(product.vendorId)) {
                    vendorItemsMap.set(product.vendorId, []);
                }
                vendorItemsMap.get(product.vendorId).push(itemDetail);
            }
        }
        const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
        const orderNumber = `MYG-${Date.now()}-${randomSuffix}`;
        const finalAmount = calculatedTotalPaise / 100;
        return this.prisma.$transaction(async (tx) => {
            for (const item of normalizedItems) {
                const updateResult = await tx.product.updateMany({
                    where: {
                        id: item.productId,
                        stockQuantity: { gte: item.quantity },
                    },
                    data: {
                        stockQuantity: { decrement: item.quantity },
                    },
                });
                if (updateResult.count === 0) {
                    const currentProduct = await tx.product.findUnique({ where: { id: item.productId } });
                    throw new common_1.BadRequestException(`Insufficient stock for '${currentProduct?.title || item.productId}'. Stock available: ${currentProduct?.stockQuantity || 0}, requested: ${item.quantity}`);
                }
            }
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    userId: dto.userId || null,
                    guestName: dto.guestName || null,
                    guestEmail: dto.guestEmail || null,
                    guestPhone: dto.guestPhone || null,
                    totalAmount: finalAmount,
                    finalAmount: finalAmount,
                    items: validatedItems,
                    shippingAddress: dto.shippingAddress,
                    orderStatus: 'PENDING',
                    paymentStatus: 'PENDING',
                },
            });
            let vCounter = 1;
            for (const [vendorId, vItems] of vendorItemsMap.entries()) {
                const vTotal = vItems.reduce((acc, curr) => acc + curr.itemTotal, 0);
                await tx.vendorOrder.create({
                    data: {
                        orderId: order.id,
                        vendorId,
                        vendorOrderNumber: `${orderNumber}-V${vCounter++}`,
                        orderStatus: 'PENDING',
                        items: vItems,
                        totalAmount: vTotal,
                    },
                });
            }
            return {
                ...order,
                _id: order.id,
            };
        });
    }
    mapOrder(order) {
        const rawItems = Array.isArray(order.items) ? order.items : [];
        const mappedProducts = rawItems.map((item, idx) => ({
            _id: item.productId || item.id || `item-${idx}`,
            productId: item.productId || item.id || '',
            name: item.title || item.name || 'Jewellery Product',
            price: Number(item.unitPrice || item.price || 0),
            quantity: Number(item.quantity || 1),
            subtotal: Number(item.itemTotal || (item.unitPrice ? item.unitPrice * item.quantity : 0)),
            status: order.orderStatus,
            image: item.image || '',
        }));
        const total = Number(order.totalAmount || order.finalAmount || 0);
        const finalAmt = Number(order.finalAmount || order.totalAmount || 0);
        return {
            _id: order.id,
            id: order.id,
            orderNumber: order.orderNumber,
            userId: order.user
                ? {
                    _id: order.user.id,
                    id: order.user.id,
                    name: order.user.name,
                    email: order.user.email,
                    phone: order.user.phone || '',
                }
                : {
                    _id: order.userId || 'guest',
                    name: order.guestName || 'Guest Customer',
                    email: order.guestEmail || 'guest@gurujewellers.com',
                    phone: order.guestPhone || '',
                },
            products: mappedProducts,
            subtotal: total,
            shippingCharge: 0,
            tax: 0,
            taxAmount: 0,
            totalAmount: total,
            discountAmount: Number(order.discountAmount || 0),
            finalAmount: finalAmt,
            status: order.orderStatus,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            paymentMethod: 'Online / Razorpay',
            shippingAddress: typeof order.shippingAddress === 'string'
                ? JSON.parse(order.shippingAddress)
                : order.shippingAddress || {},
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
        };
    }
    async findAllOrders(params) {
        const page = Math.max(1, Number(params?.page || 1));
        const limit = Math.max(1, Number(params?.limit || 10));
        const skip = (page - 1) * limit;
        const where = {};
        if (params?.status && params.status !== 'all') {
            where.orderStatus = params.status.toUpperCase();
        }
        if (params?.paymentStatus && params.paymentStatus !== 'all') {
            where.paymentStatus = params.paymentStatus.toUpperCase();
        }
        if (params?.customerId) {
            where.userId = params.customerId;
        }
        if (params?.startDate || params?.endDate) {
            where.createdAt = {};
            if (params.startDate)
                where.createdAt.gte = new Date(params.startDate);
            if (params.endDate)
                where.createdAt.lte = new Date(params.endDate);
        }
        if (params?.search && params.search.trim()) {
            const s = params.search.trim();
            where.OR = [
                { orderNumber: { contains: s, mode: 'insensitive' } },
                { guestName: { contains: s, mode: 'insensitive' } },
                { guestEmail: { contains: s, mode: 'insensitive' } },
                { guestPhone: { contains: s, mode: 'insensitive' } },
            ];
        }
        const orderByField = params?.sortBy || 'createdAt';
        const orderDirection = params?.sortOrder || 'desc';
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: { user: true },
                orderBy: [{ [orderByField]: orderDirection }, { id: 'desc' }],
                skip,
                take: limit,
            }),
            this.prisma.order.count({ where }),
        ]);
        return {
            orders: orders.map((o) => this.mapOrder(o)),
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit) || 1,
            },
        };
    }
    async getOrderById(id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: { user: true, vendorOrders: true, transactions: true },
        });
        if (!order) {
            throw new common_1.NotFoundException(`Order with ID '${id}' not found.`);
        }
        return this.mapOrder(order);
    }
    async updateOrderStatus(id, status) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException(`Order not found`);
        const updated = await this.prisma.order.update({
            where: { id },
            data: { orderStatus: status.toUpperCase() },
            include: { user: true },
        });
        return this.mapOrder(updated);
    }
    async updatePaymentStatus(id, paymentStatus) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException(`Order not found`);
        const updated = await this.prisma.order.update({
            where: { id },
            data: { paymentStatus: paymentStatus.toUpperCase() },
            include: { user: true },
        });
        return this.mapOrder(updated);
    }
    async deleteOrder(id) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException(`Order not found`);
        await this.prisma.order.update({
            where: { id },
            data: { orderStatus: 'CANCELLED' },
        });
        return { success: true };
    }
    async getRefunds(params) {
        return this.findAllOrders({ ...params, status: 'CANCELLED' });
    }
    async getUserOrders(userId) {
        const orders = await this.prisma.order.findMany({
            where: { userId },
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });
        return orders.map((o) => this.mapOrder(o));
    }
    async getOrderByNumber(orderNumber) {
        const order = await this.prisma.order.findUnique({
            where: { orderNumber },
            include: { user: true },
        });
        if (!order) {
            throw new common_1.NotFoundException(`Order '${orderNumber}' not found.`);
        }
        return this.mapOrder(order);
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map