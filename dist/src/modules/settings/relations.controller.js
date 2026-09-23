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
exports.RelationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const filter_config_service_1 = require("./filter-config.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let RelationsController = class RelationsController {
    constructor(filterConfigService) {
        this.filterConfigService = filterConfigService;
    }
    async getAllRelations() {
        const relations = await this.filterConfigService.getRecipientsList();
        const mapped = relations.map((r) => ({
            _id: r._id,
            id: r._id,
            name: r.name,
            slug: r.slug,
            isActive: r.isActive !== undefined ? r.isActive : true,
        }));
        return {
            status: 'success',
            data: {
                relations: mapped,
                pagination: { total: mapped.length, page: 1, limit: 100, pages: 1 }
            }
        };
    }
    async createRelation(dto) {
        const relation = await this.filterConfigService.addRecipient(dto);
        return { status: 'success', data: { relation } };
    }
    async updateRelation(id, dto) {
        const relation = await this.filterConfigService.updateRecipient(id, dto);
        return { status: 'success', data: { relation } };
    }
    async toggleRelationStatus(id) {
        const list = await this.filterConfigService.getRecipientsList();
        const found = list.find((r) => r._id === id);
        const active = found ? found.isActive : true;
        const relation = await this.filterConfigService.updateRecipient(id, { isActive: !active });
        return { status: 'success', data: { relation } };
    }
    async deleteRelation(id) {
        await this.filterConfigService.deleteRecipient(id);
        return { status: 'success', message: 'Relation deleted successfully' };
    }
};
exports.RelationsController = RelationsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all relations/recipients' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RelationsController.prototype, "getAllRelations", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create new relation/recipient' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RelationsController.prototype, "createRelation", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update relation/recipient by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RelationsController.prototype, "updateRelation", null);
__decorate([
    (0, common_1.Patch)(':id/toggle-status'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle relation/recipient status' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RelationsController.prototype, "toggleRelationStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete relation/recipient by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RelationsController.prototype, "deleteRelation", null);
exports.RelationsController = RelationsController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Relations/Recipients'),
    (0, common_1.Controller)('relations'),
    __metadata("design:paramtypes", [filter_config_service_1.FilterConfigService])
], RelationsController);
//# sourceMappingURL=relations.controller.js.map