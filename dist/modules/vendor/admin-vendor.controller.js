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
exports.AdminVendorController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const vendor_service_1 = require("./vendor.service");
const vendor_product_service_1 = require("./vendor-product.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const vendor_dto_1 = require("./dto/vendor.dto");
let AdminVendorController = class AdminVendorController {
    constructor(vendorService, vendorProductService) {
        this.vendorService = vendorService;
        this.vendorProductService = vendorProductService;
    }
    async getVendors(status) {
        const vendors = await this.vendorService.getAllVendors(status);
        return {
            status: 'success',
            data: { vendors },
        };
    }
    async approveVendor(id) {
        const vendor = await this.vendorService.approveVendor(id);
        return {
            status: 'success',
            message: 'Vendor application approved.',
            data: { vendor },
        };
    }
    async rejectVendor(id, dto) {
        const vendor = await this.vendorService.rejectVendor(id, dto.reason);
        return {
            status: 'success',
            message: 'Vendor application rejected.',
            data: { vendor },
        };
    }
    async suspendVendor(id) {
        const vendor = await this.vendorService.suspendVendor(id);
        return {
            status: 'success',
            message: 'Vendor account suspended.',
            data: { vendor },
        };
    }
    async getPendingProducts() {
        const products = await this.vendorProductService.getPendingProducts();
        return {
            status: 'success',
            data: { products },
        };
    }
    async approveProduct(id) {
        const product = await this.vendorProductService.approveProduct(id);
        return {
            status: 'success',
            message: 'Vendor product approved and published to MYG website.',
            data: { product },
        };
    }
    async rejectProduct(id, dto) {
        const product = await this.vendorProductService.rejectProduct(id, dto.reason);
        return {
            status: 'success',
            message: 'Vendor product rejected.',
            data: { product },
        };
    }
};
exports.AdminVendorController = AdminVendorController;
__decorate([
    (0, common_1.Get)('vendors'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: List all vendor accounts & applications' }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminVendorController.prototype, "getVendors", null);
__decorate([
    (0, common_1.Put)('vendors/:id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Approve vendor application' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminVendorController.prototype, "approveVendor", null);
__decorate([
    (0, common_1.Put)('vendors/:id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Reject vendor application with reason' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, vendor_dto_1.RejectReasonDto]),
    __metadata("design:returntype", Promise)
], AdminVendorController.prototype, "rejectVendor", null);
__decorate([
    (0, common_1.Put)('vendors/:id/suspend'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Suspend vendor account' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminVendorController.prototype, "suspendVendor", null);
__decorate([
    (0, common_1.Get)('vendor-products/pending'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: List vendor products pending approval' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminVendorController.prototype, "getPendingProducts", null);
__decorate([
    (0, common_1.Put)('vendor-products/:id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Approve vendor product (Publishes to MYG Website)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminVendorController.prototype, "approveProduct", null);
__decorate([
    (0, common_1.Put)('vendor-products/:id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Reject vendor product with reason' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, vendor_dto_1.RejectReasonDto]),
    __metadata("design:returntype", Promise)
], AdminVendorController.prototype, "rejectProduct", null);
exports.AdminVendorController = AdminVendorController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Vendor Management'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [vendor_service_1.VendorService,
        vendor_product_service_1.VendorProductService])
], AdminVendorController);
//# sourceMappingURL=admin-vendor.controller.js.map