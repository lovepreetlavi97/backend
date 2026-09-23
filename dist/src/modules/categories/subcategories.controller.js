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
exports.SubCategoriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const slugify_1 = require("slugify");
let SubCategoriesController = class SubCategoriesController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllSubcategories(pageStr, limitStr, search, categoryId) {
        const page = pageStr ? parseInt(pageStr, 10) : 1;
        const limit = limitStr ? parseInt(limitStr, 10) : 10;
        const skip = (page - 1) * limit;
        const where = { isDeleted: false };
        if (categoryId) {
            where.categoryId = categoryId;
        }
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        const [subcategories, total] = await Promise.all([
            this.prisma.subCategory.findMany({
                where,
                include: { category: true },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.subCategory.count({ where }),
        ]);
        const mapped = subcategories.map(sub => ({
            _id: sub.id,
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            image: sub.image,
            description: sub.description,
            categoryId: sub.category ? { _id: sub.category.id, name: sub.category.name } : sub.categoryId,
            category: sub.category ? { _id: sub.category.id, name: sub.category.name } : null,
            isBlocked: false,
            createdAt: sub.createdAt.toISOString(),
            updatedAt: sub.updatedAt.toISOString(),
        }));
        return {
            status: true,
            message: 'Subcategories fetched successfully',
            data: {
                subcategories: mapped,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                },
            },
        };
    }
    async getSubcategoryById(id) {
        const sub = await this.prisma.subCategory.findFirst({
            where: { id, isDeleted: false },
            include: { category: true },
        });
        if (!sub) {
            throw new common_1.NotFoundException('Subcategory not found');
        }
        return {
            status: true,
            message: 'Subcategory fetched successfully',
            data: {
                subcategory: {
                    _id: sub.id,
                    id: sub.id,
                    name: sub.name,
                    slug: sub.slug,
                    image: sub.image,
                    description: sub.description,
                    categoryId: sub.category ? { _id: sub.category.id, name: sub.category.name } : sub.categoryId,
                    category: sub.category ? { _id: sub.category.id, name: sub.category.name } : null,
                    isBlocked: false,
                },
            },
        };
    }
    async createSubcategory(dto) {
        const categoryId = dto.categoryId || dto.category;
        const slug = (0, slugify_1.default)(dto.name, { lower: true, strict: true }) + '-' + Math.random().toString(36).slice(2, 7);
        const sub = await this.prisma.subCategory.create({
            data: {
                name: dto.name,
                slug,
                image: dto.image || null,
                description: dto.description || null,
                categoryId,
            },
        });
        return {
            status: true,
            message: 'Subcategory created successfully',
            data: { subcategory: sub },
        };
    }
    async updateSubcategory(id, dto) {
        const sub = await this.prisma.subCategory.findUnique({ where: { id } });
        if (!sub || sub.isDeleted) {
            throw new common_1.NotFoundException('Subcategory not found');
        }
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name;
        if (dto.image !== undefined)
            data.image = dto.image;
        if (dto.description !== undefined)
            data.description = dto.description;
        if (dto.categoryId !== undefined)
            data.categoryId = dto.categoryId;
        else if (dto.category !== undefined)
            data.categoryId = dto.category;
        const updated = await this.prisma.subCategory.update({
            where: { id },
            data,
        });
        return {
            status: true,
            message: 'Subcategory updated successfully',
            data: { subcategory: updated },
        };
    }
    async deleteSubcategory(id) {
        const sub = await this.prisma.subCategory.findUnique({ where: { id } });
        if (!sub || sub.isDeleted) {
            throw new common_1.NotFoundException('Subcategory not found');
        }
        await this.prisma.subCategory.update({
            where: { id },
            data: { isDeleted: true },
        });
        return {
            status: true,
            message: 'Subcategory deleted successfully',
        };
    }
};
exports.SubCategoriesController = SubCategoriesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all subcategories' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('categoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], SubCategoriesController.prototype, "getAllSubcategories", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get subcategory by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubCategoriesController.prototype, "getSubcategoryById", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Create new subcategory' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SubCategoriesController.prototype, "createSubcategory", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update subcategory by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SubCategoriesController.prototype, "updateSubcategory", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.Role.ADMIN, client_1.Role.SUPERADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Delete subcategory by ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SubCategoriesController.prototype, "deleteSubcategory", null);
exports.SubCategoriesController = SubCategoriesController = __decorate([
    (0, swagger_1.ApiTags)('Admin - Subcategories Management'),
    (0, common_1.Controller)('subcategories'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubCategoriesController);
//# sourceMappingURL=subcategories.controller.js.map