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
exports.FestivalsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const filter_config_service_1 = require("./filter-config.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let FestivalsController = class FestivalsController {
    constructor(filterConfigService) {
        this.filterConfigService = filterConfigService;
    }
    async getAllFestivals() {
        const festivals = await this.filterConfigService.getOccasionsList();
        const mapped = festivals.map((f) => ({
            _id: f._id,
            id: f._id,
            name: f.name,
            slug: f.slug,
            image: f.image,
            isActive: f.isActive !== undefined ? f.isActive : true,
        }));
        return {
            status: 'success',
            data: {
                festivals: mapped,
                pagination: { total: mapped.length, page: 1, limit: 100, pages: 1 }
            }
        };
    }
    async createFestival(dto) {
        const festival = await this.filterConfigService.addOccasion(dto);
        return { status: 'success', data: { festival } };
    }
    async updateFestival(id, dto) {
        const festival = await this.filterConfigService.updateOccasion(id, dto);
        return { status: 'success', data: { festival } };
    }
    async toggleFestivalStatus(id) {
        const list = await this.filterConfigService.getOccasionsList();
        const found = list.find((o) => o._id === id);
        const active = found ? found.isActive : true;
        const festival = await this.filterConfigService.updateOccasion(id, { isActive: !active });
        return { status: 'success', data: { festival } };
    }
    async deleteFestival(id) {
        await this.filterConfigService.deleteOccasion(id);
        return { status: 'success', message: 'Festival deleted successfully' };
    }
};
exports.FestivalsController = FestivalsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all festivals/occasions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FestivalsController.prototype, "getAllFestivals", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create new festival/occasion' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FestivalsController.prototype, "createFestival", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update festival/occasion by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FestivalsController.prototype, "updateFestival", null);
__decorate([
    (0, common_1.Patch)(':id/toggle-status'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle festival/occasion status' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FestivalsController.prototype, "toggleFestivalStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete festival/occasion by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FestivalsController.prototype, "deleteFestival", null);
exports.FestivalsController = FestivalsController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Festivals/Occasions'),
    (0, common_1.Controller)('festivals'),
    __metadata("design:paramtypes", [filter_config_service_1.FilterConfigService])
], FestivalsController);
//# sourceMappingURL=festivals.controller.js.map