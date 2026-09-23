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
exports.VendorOrderService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let VendorOrderService = class VendorOrderService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getVendorOrders(vendorId, page = 1, limit = 20, status) {
        const skip = (page - 1) * limit;
        const [vendorOrders, total] = await Promise.all([
            this.prisma.vendorOrder.findMany({
                where: {
                    vendorId,
                    orderStatus: status ? status : undefined,
                },
                include: {
                    order: {
                        select: {
                            orderNumber: true,
                            shippingAddress: true,
                            createdAt: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.vendorOrder.count({
                where: {
                    vendorId,
                    orderStatus: status ? status : undefined,
                },
            }),
        ]);
        return {
            vendorOrders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async getVendorOrderById(vendorId, vendorOrderId) {
        const vendorOrder = await this.prisma.vendorOrder.findUnique({
            where: { id: vendorOrderId },
            include: {
                order: {
                    select: {
                        orderNumber: true,
                        shippingAddress: true,
                        createdAt: true,
                    },
                },
            },
        });
        if (!vendorOrder) {
            throw new common_1.NotFoundException('Vendor order not found.');
        }
        if (vendorOrder.vendorId !== vendorId) {
            throw new common_1.ForbiddenException('Access denied: You do not own this order.');
        }
        return vendorOrder;
    }
    async updateVendorOrderStatus(vendorId, vendorOrderId, status) {
        const vendorOrder = await this.prisma.vendorOrder.findUnique({
            where: { id: vendorOrderId },
        });
        if (!vendorOrder) {
            throw new common_1.NotFoundException('Vendor order not found.');
        }
        if (vendorOrder.vendorId !== vendorId) {
            throw new common_1.ForbiddenException('Access denied: You do not own this order.');
        }
        return this.prisma.vendorOrder.update({
            where: { id: vendorOrderId },
            data: { orderStatus: status },
        });
    }
    async updateTrackingInfo(vendorId, vendorOrderId, dto) {
        const vendorOrder = await this.prisma.vendorOrder.findUnique({
            where: { id: vendorOrderId },
        });
        if (!vendorOrder) {
            throw new common_1.NotFoundException('Vendor order not found.');
        }
        if (vendorOrder.vendorId !== vendorId) {
            throw new common_1.ForbiddenException('Access denied: You do not own this order.');
        }
        return this.prisma.vendorOrder.update({
            where: { id: vendorOrderId },
            data: {
                trackingNumber: dto.trackingNumber,
                carrier: dto.carrier,
                orderStatus: 'SHIPPED',
            },
        });
    }
};
exports.VendorOrderService = VendorOrderService;
exports.VendorOrderService = VendorOrderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VendorOrderService);
//# sourceMappingURL=vendor-order.service.js.map