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
        if (!dto.items || dto.items.length === 0) {
            throw new common_1.BadRequestException('Order items cannot be empty.');
        }
        const productIds = dto.items.map((i) => i.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
            include: { metal: true, priceRule: true },
        });
        const productMap = new Map(products.map((p) => [p.id, p]));
        let calculatedTotalPaise = 0;
        const validatedItems = [];
        const vendorItemsMap = new Map();
        for (const item of dto.items) {
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
            for (const item of dto.items) {
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
            return order;
        });
    }
    async getUserOrders(userId) {
        return this.prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getOrderByNumber(orderNumber) {
        const order = await this.prisma.order.findUnique({
            where: { orderNumber },
        });
        if (!order) {
            throw new common_1.NotFoundException(`Order '${orderNumber}' not found.`);
        }
        return order;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map