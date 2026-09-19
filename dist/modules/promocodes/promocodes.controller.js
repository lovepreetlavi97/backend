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
exports.PromoCodesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const promocodes_service_1 = require("./promocodes.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let PromoCodesController = class PromoCodesController {
    constructor(promoCodesService) {
        this.promoCodesService = promoCodesService;
    }
    async getActivePromos(productDetail) {
        const isProductDetail = productDetail === 'true' || productDetail === '1';
        const promos = await this.promoCodesService.getActivePromos(isProductDetail);
        return { status: 'success', data: { promos } };
    }
    async validate(dto) {
        const result = await this.promoCodesService.validatePromoCode(dto.code, Number(dto.totalAmount) || 0);
        return { status: 'success', data: result, promo: result.promo };
    }
    async validateByParam(code, totalAmount) {
        const total = totalAmount ? parseFloat(totalAmount) : 0;
        const result = await this.promoCodesService.validatePromoCode(code, total);
        return { status: 'success', data: result, promo: result.promo };
    }
    async getAllPromoCodes(pageStr, limitStr, search, status) {
        const page = pageStr ? parseInt(pageStr, 10) : 1;
        const limit = limitStr ? parseInt(limitStr, 10) : 10;
        const data = await this.promoCodesService.findAll({ page, limit, search, status });
        return {
            status: 'success',
            data,
        };
    }
    async getPromoById(id) {
        const promoCode = await this.promoCodesService.findById(id);
        return {
            status: 'success',
            data: { promoCode },
        };
    }
    async createPromo(dto) {
        const result = await this.promoCodesService.createPromoCode(dto);
        return { status: 'success', message: 'Promo code created.', data: { promoCode: result } };
    }
    async updatePromo(id, dto) {
        const promoCode = await this.promoCodesService.updatePromoCode(id, dto);
        return { status: 'success', message: 'Promo code updated.', data: { promoCode } };
    }
    async deletePromo(id) {
        await this.promoCodesService.deletePromoCode(id);
        return { status: 'success', message: 'Promo code deleted successfully.' };
    }
    async togglePromoStatus(id) {
        const promoCode = await this.promoCodesService.toggleStatus(id);
        return { status: 'success', message: 'Status updated.', data: { promoCode } };
    }
    async toggleProductDetail(id) {
        const promoCode = await this.promoCodesService.toggleShowInProductDetail(id);
        return { status: 'success', message: 'Product detail display toggle updated.', data: { promoCode } };
    }
};
exports.PromoCodesController = PromoCodesController;
__decorate([
    (0, common_1.Get)('active'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all active promo codes for products (optionally filtered by showInProductDetail)' }),
    __param(0, (0, common_1.Query)('productDetail')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PromoCodesController.prototype, "getActivePromos", null);
__decorate([
    (0, common_1.Post)('validate'),
    (0, swagger_1.ApiOperation)({ summary: 'Validate coupon promo code for order checkout' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PromoCodesController.prototype, "validate", null);
__decorate([
    (0, common_1.Get)('validate/:code'),
    (0, swagger_1.ApiOperation)({ summary: 'Validate coupon promo code by URL parameter' }),
    __param(0, (0, common_1.Param)('code')),
    __param(1, (0, common_1.Query)('totalAmount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PromoCodesController.prototype, "validateByParam", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get all promo codes with pagination & filters' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], PromoCodesController.prototype, "getAllPromoCodes", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get promo code by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PromoCodesController.prototype, "getPromoById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Create new promo coupon code' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PromoCodesController.prototype, "createPromo", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update promo code by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PromoCodesController.prototype, "updatePromo", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Delete promo code by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PromoCodesController.prototype, "deletePromo", null);
__decorate([
    (0, common_1.Patch)(':id/toggle-status'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Toggle promo code status' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PromoCodesController.prototype, "togglePromoStatus", null);
__decorate([
    (0, common_1.Patch)(':id/toggle-product-detail'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Toggle promo code show in product detail page' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PromoCodesController.prototype, "toggleProductDetail", null);
exports.PromoCodesController = PromoCodesController = __decorate([
    (0, swagger_1.ApiTags)('Promo Codes & Coupons'),
    (0, common_1.Controller)('promocodes'),
    __metadata("design:paramtypes", [promocodes_service_1.PromoCodesService])
], PromoCodesController);
//# sourceMappingURL=promocodes.controller.js.map