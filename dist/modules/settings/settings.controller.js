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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const settings_service_1 = require("./settings.service");
const filter_config_service_1 = require("./filter-config.service");
const filter_config_dto_1 = require("./dto/filter-config.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let SettingsController = class SettingsController {
    constructor(settingsService, filterConfigService) {
        this.settingsService = settingsService;
        this.filterConfigService = filterConfigService;
    }
    async getPublicSettings() {
        const data = await this.settingsService.getPublicSettings();
        return {
            status: 200,
            message: 'Site settings fetched successfully.',
            data,
        };
    }
    async getAdminSettings() {
        const data = await this.settingsService.getPublicSettings();
        return {
            status: 200,
            message: 'Site settings fetched successfully.',
            data,
        };
    }
    async updateAdminSettings(dto) {
        const data = await this.settingsService.updatePublicSettings(dto);
        return {
            status: 200,
            message: 'Site settings updated successfully.',
            data,
        };
    }
    async contact(dto) {
        const result = await this.settingsService.submitContactForm(dto);
        return { status: 'success', message: 'We will get back to you soon.', data: { contact: result } };
    }
    async grievance(userId, dto) {
        const result = await this.settingsService.submitGrievance(userId, dto);
        return { status: 'success', message: 'Grievance submitted successfully.', data: { grievance: result } };
    }
    async designRequest(userId, dto) {
        const result = await this.settingsService.submitDesignRequest(userId, dto);
        return { status: 'success', message: 'Custom design request submitted.', data: { request: result } };
    }
    async updateGiftStoreConfig(dto) {
        const updated = await this.filterConfigService.updateGiftStoreConfig(dto);
        return {
            status: 'success',
            message: 'Filter configuration updated successfully.',
            data: updated,
        };
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)('public'),
    (0, swagger_1.ApiOperation)({ summary: 'Get public site settings' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getPublicSettings", null);
__decorate([
    (0, common_1.Get)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get full site settings' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getAdminSettings", null);
__decorate([
    (0, common_1.Put)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update site settings' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateAdminSettings", null);
__decorate([
    (0, common_1.Post)('contact'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit Contact Us enquiry form' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "contact", null);
__decorate([
    (0, common_1.Post)('grievance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Submit customer grievance ticket' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "grievance", null);
__decorate([
    (0, common_1.Post)('design-request'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Submit custom jewellery design request' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "designRequest", null);
__decorate([
    (0, common_1.Put)('gift-store-config'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update Gift Store & Filter configuration' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filter_config_dto_1.UpdateGiftStoreConfigDto]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateGiftStoreConfig", null);
exports.SettingsController = SettingsController = __decorate([
    (0, swagger_1.ApiTags)('Settings & Customer Inquiries'),
    (0, common_1.Controller)('settings'),
    __metadata("design:paramtypes", [settings_service_1.SettingsService,
        filter_config_service_1.FilterConfigService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map