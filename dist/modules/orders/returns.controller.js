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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const orders_service_1 = require("./orders.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let ReturnsController = class ReturnsController {
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    async getAllReturns(pageStr, limitStr, search) {
        const page = pageStr ? parseInt(pageStr, 10) : 1;
        const limit = limitStr ? parseInt(limitStr, 10) : 10;
        const ordersRes = await this.ordersService.findAllOrders({
            page,
            limit,
            search,
            status: 'CANCELLED',
        });
        const mappedReturns = ordersRes.orders.map((o) => ({
            _id: o._id,
            id: o._id,
            orderId: {
                _id: o._id,
                orderNumber: o.orderNumber,
            },
            userId: {
                _id: o.userId?._id || 'guest',
                name: o.userId?.name || 'Customer',
                email: o.userId?.email || 'customer@example.com',
            },
            products: o.products.map((p) => ({
                productId: {
                    _id: p.productId,
                    name: p.name,
                    image: p.image || '',
                },
                quantity: p.quantity,
                price: p.price,
                reason: 'Customer requested return/refund',
            })),
            returnReason: 'Cancelled / Return request',
            returnStatus: 'completed',
            refundAmount: o.finalAmount || o.totalAmount,
            refundStatus: o.paymentStatus === 'REFUNDED' ? 'processed' : 'pending',
            refundMethod: 'original_payment',
            trackingNumber: '',
            adminNotes: 'Processed via admin panel',
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
        }));
        return {
            status: 'success',
            data: {
                returns: mappedReturns,
                pagination: ordersRes.pagination,
            },
        };
    }
    async getReturnById(id) {
        const o = await this.ordersService.getOrderById(id);
        const returnObj = {
            _id: o._id,
            id: o._id,
            orderId: {
                _id: o._id,
                orderNumber: o.orderNumber,
            },
            userId: {
                _id: o.userId?._id || 'guest',
                name: o.userId?.name || 'Customer',
                email: o.userId?.email || 'customer@example.com',
            },
            products: o.products.map((p) => ({
                productId: {
                    _id: p.productId,
                    name: p.name,
                    image: p.image || '',
                },
                quantity: p.quantity,
                price: p.price,
                reason: 'Customer requested return',
            })),
            returnReason: 'Return request',
            returnStatus: 'completed',
            refundAmount: o.finalAmount || o.totalAmount,
            refundStatus: o.paymentStatus === 'REFUNDED' ? 'processed' : 'pending',
            refundMethod: 'original_payment',
            trackingNumber: '',
            adminNotes: '',
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
        };
        return {
            status: 'success',
            data: { return: returnObj },
        };
    }
    async processRefund(id) {
        await this.ordersService.updatePaymentStatus(id, 'REFUNDED');
        return {
            status: 'success',
            message: 'Refund processed successfully.',
        };
    }
    async updateReturnStatus(id, status) {
        await this.ordersService.updateOrderStatus(id, status || 'CANCELLED');
        return {
            status: 'success',
            message: 'Status updated.',
        };
    }
};
exports.ReturnsController = ReturnsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get all returns and refunds' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReturnsController.prototype, "getAllReturns", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get return details by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReturnsController.prototype, "getReturnById", null);
__decorate([
    (0, common_1.Post)(':id/refund'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Process refund' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReturnsController.prototype, "processRefund", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update return status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReturnsController.prototype, "updateReturnStatus", null);
exports.ReturnsController = ReturnsController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Returns & Refunds'),
    (0, common_1.Controller)('returns'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], ReturnsController);
//# sourceMappingURL=returns.controller.js.map