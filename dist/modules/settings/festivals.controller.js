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
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const filter_config_service_1 = require("./filter-config.service");
const uploads_service_1 = require("../uploads/uploads.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let FestivalsController = class FestivalsController {
    constructor(filterConfigService, uploadsService) {
        this.filterConfigService = filterConfigService;
        this.uploadsService = uploadsService;
    }
    async getAllFestivals(status, search, page, limit, metalId) {
        let festivals = await this.filterConfigService.getOccasionsList();
        if (status === 'active') {
            festivals = festivals.filter((f) => f.isActive !== false && f.status !== 'inactive');
        }
        else if (status === 'inactive') {
            festivals = festivals.filter((f) => f.isActive === false || f.status === 'inactive');
        }
        if (metalId && metalId.trim() !== '' && metalId.toLowerCase() !== 'all') {
            const mid = metalId.trim();
            festivals = festivals.filter((f) => {
                if (!f.metalIds || !Array.isArray(f.metalIds) || f.metalIds.length === 0)
                    return false;
                return f.metalIds.includes(mid);
            });
        }
        if (search && search.trim()) {
            const q = search.trim().toLowerCase();
            festivals = festivals.filter((f) => (f.name && f.name.toLowerCase().includes(q)) ||
                (f.description && f.description.toLowerCase().includes(q)));
        }
        const total = festivals.length;
        const pageNum = page ? Math.max(parseInt(page, 10), 1) : 1;
        const limitNum = limit ? Math.max(parseInt(limit, 10), 1) : 100;
        const pages = Math.ceil(total / limitNum) || 1;
        const mapped = festivals.map((f) => ({
            _id: f._id,
            id: f._id,
            name: f.name,
            description: f.description || '',
            slug: f.slug,
            image: typeof f.image === 'string' ? f.image : typeof f.mainImage === 'string' ? f.mainImage : '',
            mainImage: typeof f.image === 'string' ? f.image : typeof f.mainImage === 'string' ? f.mainImage : '',
            link: f.link || f.url || '',
            startDate: f.startDate || '',
            endDate: f.endDate || '',
            metalIds: f.metalIds || [],
            isActive: f.isActive !== false && f.status !== 'inactive',
        }));
        return {
            status: 'success',
            data: {
                festivals: mapped,
                pagination: { total, page: pageNum, limit: limitNum, pages },
            },
        };
    }
    async createFestival(file, dto) {
        let imageKey = typeof dto.image === 'string' ? dto.image : typeof dto.mainImage === 'string' ? dto.mainImage : '';
        if (file) {
            const uploadRes = await this.uploadsService.uploadAndCompressImage(file.buffer, file.originalname, file.mimetype, 'festivals');
            imageKey = uploadRes.key || uploadRes.url;
        }
        let metalIds = dto.metalIds;
        if (metalIds !== undefined) {
            if (typeof metalIds === 'string') {
                try {
                    metalIds = JSON.parse(metalIds);
                }
                catch {
                    metalIds = [metalIds];
                }
            }
        }
        else {
            metalIds = [];
        }
        const payload = {
            ...dto,
            metalIds: Array.isArray(metalIds) ? metalIds : [metalIds],
            isActive: dto.isActive === 'false' || dto.isActive === false ? false : true,
            image: typeof imageKey === 'string' ? imageKey : '',
        };
        const festival = await this.filterConfigService.addOccasion(payload);
        return { status: 'success', data: { festival } };
    }
    async updateFestival(id, file, dto) {
        let imageKey = undefined;
        if (file) {
            const uploadRes = await this.uploadsService.uploadAndCompressImage(file.buffer, file.originalname, file.mimetype, 'festivals');
            imageKey = uploadRes.key || uploadRes.url;
        }
        else if (typeof dto.image === 'string' && dto.image) {
            imageKey = dto.image;
        }
        else if (typeof dto.mainImage === 'string' && dto.mainImage) {
            imageKey = dto.mainImage;
        }
        let metalIds = dto.metalIds;
        if (metalIds !== undefined) {
            if (typeof metalIds === 'string') {
                try {
                    metalIds = JSON.parse(metalIds);
                }
                catch {
                    metalIds = [metalIds];
                }
            }
        }
        const payload = {
            ...dto,
            ...(metalIds !== undefined ? { metalIds: Array.isArray(metalIds) ? metalIds : [metalIds] } : {}),
            ...(dto.isActive !== undefined ? { isActive: dto.isActive === 'false' || dto.isActive === false ? false : true } : {}),
            ...(imageKey !== undefined ? { image: imageKey } : {}),
        };
        const festival = await this.filterConfigService.updateOccasion(id, payload);
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
    (0, swagger_1.ApiOperation)({ summary: 'Get all festivals/occasions for admin (active and inactive)' }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __param(4, (0, common_1.Query)('metalId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], FestivalsController.prototype, "getAllFestivals", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    (0, swagger_1.ApiOperation)({ summary: 'Create new festival/occasion' }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FestivalsController.prototype, "createFestival", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    (0, swagger_1.ApiOperation)({ summary: 'Update festival/occasion by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
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
    __metadata("design:paramtypes", [filter_config_service_1.FilterConfigService,
        uploads_service_1.UploadsService])
], FestivalsController);
//# sourceMappingURL=festivals.controller.js.map