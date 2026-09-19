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
exports.VendorController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const vendor_service_1 = require("./vendor.service");
const vendor_product_service_1 = require("./vendor-product.service");
const vendor_order_service_1 = require("./vendor-order.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const vendor_guard_1 = require("../../common/guards/vendor.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const vendor_dto_1 = require("./dto/vendor.dto");
let VendorController = class VendorController {
    constructor(vendorService, vendorProductService, vendorOrderService) {
        this.vendorService = vendorService;
        this.vendorProductService = vendorProductService;
        this.vendorOrderService = vendorOrderService;
    }
    async registerVendor(userId, dto) {
        const vendor = await this.vendorService.registerVendor(userId, dto);
        return {
            status: 'success',
            message: 'Vendor application submitted successfully. Pending admin review.',
            data: { vendor },
        };
    }
    async getStatus(userId) {
        const status = await this.vendorService.getVendorStatus(userId);
        return {
            status: 'success',
            data: status,
        };
    }
    async getProfile(req) {
        const profile = await this.vendorService.getVendorProfile(req.user.vendorId);
        return {
            status: 'success',
            data: { profile },
        };
    }
    async updateProfile(req, dto) {
        const profile = await this.vendorService.updateVendorProfile(req.user.vendorId, dto);
        return {
            status: 'success',
            message: 'Vendor profile updated.',
            data: { profile },
        };
    }
    async createProduct(req, dto) {
        const product = await this.vendorProductService.createVendorProduct(req.user.vendorId, dto);
        return {
            status: 'success',
            message: dto.submitForApproval
                ? 'Product submitted for admin approval.'
                : 'Product draft saved.',
            data: { product },
        };
    }
    async getProducts(req, pageStr, limitStr, status) {
        const page = Math.max(1, parseInt(pageStr || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(limitStr || '20', 10)));
        const result = await this.vendorProductService.getVendorProducts(req.user.vendorId, page, limit, status);
        return {
            status: 'success',
            data: result,
        };
    }
    async getProductById(req, id) {
        const product = await this.vendorProductService.getVendorProductById(req.user.vendorId, id);
        return {
            status: 'success',
            data: { product },
        };
    }
    async updateProduct(req, id, dto) {
        const product = await this.vendorProductService.updateVendorProduct(req.user.vendorId, id, dto);
        return {
            status: 'success',
            message: dto.submitForApproval
                ? 'Product updated and resubmitted for admin approval.'
                : 'Product updated.',
            data: { product },
        };
    }
    async deleteProduct(req, id) {
        await this.vendorProductService.deleteVendorProduct(req.user.vendorId, id);
        return {
            status: 'success',
            message: 'Product deleted.',
        };
    }
    async getOrders(req, pageStr, limitStr, status) {
        const page = Math.max(1, parseInt(pageStr || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(limitStr || '20', 10)));
        const result = await this.vendorOrderService.getVendorOrders(req.user.vendorId, page, limit, status);
        return {
            status: 'success',
            data: result,
        };
    }
    async getOrderById(req, id) {
        const order = await this.vendorOrderService.getVendorOrderById(req.user.vendorId, id);
        return {
            status: 'success',
            data: { order },
        };
    }
    async updateOrderStatus(req, id, status) {
        const order = await this.vendorOrderService.updateVendorOrderStatus(req.user.vendorId, id, status);
        return {
            status: 'success',
            message: `Sub-order status updated to ${status}.`,
            data: { order },
        };
    }
    async updateShipment(req, id, dto) {
        const order = await this.vendorOrderService.updateTrackingInfo(req.user.vendorId, id, dto);
        return {
            status: 'success',
            message: 'Shipment tracking information updated.',
            data: { order },
        };
    }
};
exports.VendorController = VendorController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Register new vendor account' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, vendor_dto_1.RegisterVendorDto]),
    __metadata("design:returntype", Promise)
], VendorController.prototype, "registerVendor", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Check vendor onboarding status & rejection reason' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VendorController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, vendor_guard_1.VendorGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get authenticated vendor profile' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VendorController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, vendor_guard_1.VendorGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update vendor profile' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, vendor_dto_1.UpdateVendorProfileDto]),
    __metadata("design:returntype", Promise)
], VendorController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('products'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, vendor_guard_1.VendorGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create vendor product (Draft or Submit for Approval)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, vendor_dto_1.CreateVendorProductDto]),
    __metadata("design:returntype", Promise)
], VendorController.prototype, "createProduct", null);
__decorate([
    (0, common_1.Get)('products'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, vendor_guard_1.VendorGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List vendor products' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], VendorController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Get)('products/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, vendor_guard_1.VendorGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get vendor product details & rejection reason' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VendorController.prototype, "getProductById", null);
__decorate([
    (0, common_1.Put)('products/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, vendor_guard_1.VendorGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update vendor product & resubmit for approval' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, vendor_dto_1.UpdateVendorProductDto]),
    __metadata("design:returntype", Promise)
], VendorController.prototype, "updateProduct", null);
__decorate([
    (0, common_1.Delete)('products/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, vendor_guard_1.VendorGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Soft delete vendor product' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VendorController.prototype, "deleteProduct", null);
__decorate([
    (0, common_1.Get)('orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, vendor_guard_1.VendorGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List assigned vendor sub-orders' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], VendorController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Get)('orders/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, vendor_guard_1.VendorGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get vendor sub-order details' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VendorController.prototype, "getOrderById", null);
__decorate([
    (0, common_1.Put)('orders/:id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, vendor_guard_1.VendorGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update sub-order status (CONFIRMED, PACKED, SHIPPED, DELIVERED)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], VendorController.prototype, "updateOrderStatus", null);
__decorate([
    (0, common_1.Put)('orders/:id/shipment'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, vendor_guard_1.VendorGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add shipment tracking number & carrier' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, vendor_dto_1.UpdateShipmentDto]),
    __metadata("design:returntype", Promise)
], VendorController.prototype, "updateShipment", null);
exports.VendorController = VendorController = __decorate([
    (0, swagger_1.ApiTags)('Vendor Portal'),
    (0, common_1.Controller)('vendor'),
    __metadata("design:paramtypes", [vendor_service_1.VendorService,
        vendor_product_service_1.VendorProductService,
        vendor_order_service_1.VendorOrderService])
], VendorController);
//# sourceMappingURL=vendor.controller.js.map