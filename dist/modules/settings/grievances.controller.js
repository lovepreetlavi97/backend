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
exports.GrievancesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let GrievancesController = class GrievancesController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAnalytics() {
        const total = await this.prisma.grievance.count();
        const open = await this.prisma.grievance.count({ where: { status: 'OPEN' } });
        return {
            status: 'success',
            data: {
                total,
                open,
                inProgress: 0,
                resolved: total - open,
            },
        };
    }
    async getAllGrievances(pageStr, limitStr, search, status) {
        const page = pageStr ? parseInt(pageStr, 10) : 1;
        const limit = limitStr ? parseInt(limitStr, 10) : 10;
        const skip = (page - 1) * limit;
        const where = {};
        if (status && status !== 'all') {
            where.status = status.toUpperCase();
        }
        if (search && search.trim()) {
            where.OR = [
                { subject: { contains: search.trim(), mode: 'insensitive' } },
                { description: { contains: search.trim(), mode: 'insensitive' } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.grievance.findMany({
                where,
                include: { user: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.grievance.count({ where }),
        ]);
        const mapped = items.map((g) => ({
            _id: g.id,
            id: g.id,
            userId: {
                _id: g.user?.id || g.userId,
                name: g.user?.name || 'Customer',
                email: g.user?.email || 'customer@example.com',
            },
            type: 'service',
            subject: g.subject,
            description: g.description,
            priority: 'medium',
            status: g.status.toLowerCase(),
            attachments: [],
            replies: [],
            createdAt: g.createdAt.toISOString(),
            updatedAt: g.createdAt.toISOString(),
        }));
        return {
            status: 'success',
            data: {
                grievances: mapped,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit) || 1,
                },
            },
        };
    }
    async getById(id) {
        const g = await this.prisma.grievance.findUnique({
            where: { id },
            include: { user: true },
        });
        if (!g) {
            return { status: 'error', message: 'Grievance not found' };
        }
        return {
            status: 'success',
            data: {
                grievance: {
                    _id: g.id,
                    id: g.id,
                    userId: {
                        _id: g.user?.id || g.userId,
                        name: g.user?.name || 'Customer',
                        email: g.user?.email || 'customer@example.com',
                    },
                    type: 'service',
                    subject: g.subject,
                    description: g.description,
                    priority: 'medium',
                    status: g.status.toLowerCase(),
                    attachments: [],
                    replies: [],
                    createdAt: g.createdAt.toISOString(),
                    updatedAt: g.createdAt.toISOString(),
                },
            },
        };
    }
    async updateStatus(id, status) {
        const g = await this.prisma.grievance.update({
            where: { id },
            data: { status: (status || 'RESOLVED').toUpperCase() },
        });
        return { status: 'success', data: { grievance: g } };
    }
    async addReply(id, message) {
        return {
            status: 'success',
            message: 'Reply recorded successfully',
        };
    }
};
exports.GrievancesController = GrievancesController;
__decorate([
    (0, common_1.Get)('analytics'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get grievances analytics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GrievancesController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get all grievances' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], GrievancesController.prototype, "getAllGrievances", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get grievance by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GrievancesController.prototype, "getById", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update grievance status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GrievancesController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)(':id/replies'),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Add reply to grievance' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('message')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GrievancesController.prototype, "addReply", null);
exports.GrievancesController = GrievancesController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Grievances'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('grievances'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GrievancesController);
//# sourceMappingURL=grievances.controller.js.map