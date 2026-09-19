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
exports.AdminSiteSettingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const settings_service_1 = require("./settings.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
let AdminSiteSettingsController = class AdminSiteSettingsController {
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    async getSiteSettings() {
        const data = await this.settingsService.getPublicSettings();
        return {
            status: 'success',
            data,
        };
    }
    async updateSiteSettings(dto) {
        const data = await this.settingsService.updatePublicSettings(dto);
        return {
            status: 'success',
            message: 'Site settings and trust badges updated successfully.',
            data,
        };
    }
};
exports.AdminSiteSettingsController = AdminSiteSettingsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get full site settings including trust badges' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminSiteSettingsController.prototype, "getSiteSettings", null);
__decorate([
    (0, common_1.Put)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update site settings and trust badges' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminSiteSettingsController.prototype, "updateSiteSettings", null);
exports.AdminSiteSettingsController = AdminSiteSettingsController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Site Settings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, common_1.Controller)('admin/site-settings'),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], AdminSiteSettingsController);
//# sourceMappingURL=admin-site-settings.controller.js.map