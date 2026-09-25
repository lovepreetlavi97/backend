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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const orders_service_1 = require("./orders.service");
const optional_jwt_auth_guard_1 = require("../../common/guards/optional-jwt-auth.guard");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let OrdersController = class OrdersController {
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    async createOrder(req, dto) {
        const userId = req.user?.id || dto.userId || undefined;
        const order = await this.ordersService.createOrder({ ...dto, userId });
        return {
            status: 'success',
            message: 'Order created successfully.',
            data: { order },
        };
    }
    async trackOrder(orderNumber) {
        const order = await this.ordersService.getOrderByNumber(orderNumber);
        return {
            status: 'success',
            data: { order },
        };
    }
    async getRefundRequests(pageStr, limitStr, search) {
        const page = pageStr ? parseInt(pageStr, 10) : 1;
        const limit = limitStr ? parseInt(limitStr, 10) : 10;
        const data = await this.ordersService.getRefunds({ page, limit, search });
        return {
            status: 'success',
            data,
        };
    }
    async getMyOrders(user) {
        const orders = await this.ordersService.getUserOrders(user.id);
        return {
            status: 'success',
            data: { orders },
        };
    }
    async getUserOrders(userId, user) {
        if (user.id !== userId && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
            throw new common_1.ForbiddenException('Access denied: You can only view your own orders.');
        }
        const orders = await this.ordersService.getUserOrders(userId);
        return {
            status: 'success',
            data: { orders },
        };
    }
    async getAllOrders(pageStr, limitStr, search, status, paymentStatus, customerId, startDate, endDate, sortBy, sortOrder) {
        const page = pageStr ? parseInt(pageStr, 10) : 1;
        const limit = limitStr ? parseInt(limitStr, 10) : 10;
        const data = await this.ordersService.findAllOrders({
            page,
            limit,
            search,
            status,
            paymentStatus,
            customerId,
            startDate,
            endDate,
            sortBy,
            sortOrder,
        });
        return {
            status: 'success',
            data,
        };
    }
    async getOrderById(id, user) {
        const order = await this.ordersService.getOrderById(id);
        const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';
        const isOwner = order.userId && typeof order.userId === 'object'
            ? order.userId._id === user.id || order.userId.id === user.id
            : order.userId === user.id;
        if (!isAdmin && !isOwner) {
            throw new common_1.ForbiddenException('Access denied: You can only view your own orders.');
        }
        return {
            status: 'success',
            data: { order },
        };
    }
    async updateOrderStatus(id, dto) {
        const order = await this.ordersService.updateOrderStatus(id, dto.status);
        return {
            status: 'success',
            message: 'Order status updated successfully.',
            data: { order },
        };
    }
    async updateOrderStatusDirect(id, dto) {
        const order = await this.ordersService.updateOrderStatus(id, dto.status);
        return {
            status: 'success',
            message: 'Order status updated successfully.',
            data: { order },
        };
    }
    async updatePaymentStatus(id, dto) {
        const order = await this.ordersService.updatePaymentStatus(id, dto.paymentStatus);
        return {
            status: 'success',
            message: 'Payment status updated successfully.',
            data: { order },
        };
    }
    async updateOrderProductStatus(orderId, productId, status) {
        return {
            status: 'success',
            message: 'Product status updated.',
        };
    }
    async deleteOrder(id) {
        await this.ordersService.deleteOrder(id);
        return {
            status: 'success',
            message: 'Order cancelled/deleted successfully.',
        };
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Create new order (Supports Guest & Authenticated Checkout)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)('track/:orderNumber'),
    (0, swagger_1.ApiOperation)({ summary: 'Public order tracking by order number (Guest & User)' }),
    __param(0, (0, common_1.Param)('orderNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "trackOrder", null);
__decorate([
    (0, common_1.Get)('refunds'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get refund requests & cancelled orders' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getRefundRequests", null);
__decorate([
    (0, common_1.Get)('user'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get order history for current user' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getMyOrders", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get order history for specified user' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getUserOrders", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get all orders with filtering and pagination' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('paymentStatus')),
    __param(5, (0, common_1.Query)('customerId')),
    __param(6, (0, common_1.Query)('startDate')),
    __param(7, (0, common_1.Query)('endDate')),
    __param(8, (0, common_1.Query)('sortBy')),
    __param(9, (0, common_1.Query)('sortOrder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getAllOrders", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get order details by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getOrderById", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update order status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateOrderStatus", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update order status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateOrderStatusDirect", null);
__decorate([
    (0, common_1.Put)(':id/payment-status'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update order payment status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updatePaymentStatus", null);
__decorate([
    (0, common_1.Patch)(':orderId/products/:productId/status'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update product status within order' }),
    __param(0, (0, common_1.Param)('orderId')),
    __param(1, (0, common_1.Param)('productId')),
    __param(2, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "updateOrderProductStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Delete order' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "deleteOrder", null);
exports.OrdersController = OrdersController = __decorate([
    (0, swagger_1.ApiTags)('Orders'),
    (0, common_1.Controller)(['order', 'orders']),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map