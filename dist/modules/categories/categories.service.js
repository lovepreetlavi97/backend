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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const uploads_service_1 = require("../uploads/uploads.service");
const redis_service_1 = require("../../shared/redis/redis.service");
const storage_util_1 = require("../../common/utils/storage.util");
const slugify_1 = require("slugify");
let CategoriesService = class CategoriesService {
    constructor(prisma, uploadsService, redis) {
        this.prisma = prisma;
        this.uploadsService = uploadsService;
        this.redis = redis;
    }
    async findAll(params) {
        const page = params?.page ? Number(params.page) : undefined;
        const limit = params?.limit ? Number(params.limit) : undefined;
        const where = { isDeleted: false };
        if (params?.search) {
            where.name = { contains: params.search, mode: 'insensitive' };
        }
        const allActiveMetals = await this.prisma.metal.findMany({
            where: { isActive: true },
            select: { id: true, name: true, slug: true },
        });
        const getCategoryMetals = (cat) => {
            if (cat.metalIds && Array.isArray(cat.metalIds) && cat.metalIds.length > 0) {
                return allActiveMetals
                    .filter((m) => cat.metalIds.includes(m.id))
                    .map((m) => ({
                    _id: m.id,
                    id: m.id,
                    name: m.name,
                    slug: m.slug,
                }));
            }
            const metalMap = new Map();
            (cat.products || []).forEach((p) => {
                if (p.metal) {
                    metalMap.set(p.metal.id, {
                        _id: p.metal.id,
                        id: p.metal.id,
                        name: p.metal.name,
                        slug: p.metal.slug,
                    });
                }
            });
            return Array.from(metalMap.values());
        };
        if (page && limit) {
            const skip = (page - 1) * limit;
            const [categories, total] = await Promise.all([
                this.prisma.category.findMany({
                    where,
                    include: {
                        subcategories: { where: { isDeleted: false } },
                        products: { where: { isDeleted: false }, select: { id: true, metal: true } },
                    },
                    skip,
                    take: limit,
                    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                }),
                this.prisma.category.count({ where }),
            ]);
            const mapped = categories.map((cat) => {
                const categoryMetals = getCategoryMetals(cat);
                return {
                    ...cat,
                    _id: cat.id,
                    metalIds: categoryMetals,
                    metals: categoryMetals,
                    productCount: cat.products.length,
                    isActive: true,
                    subcategories: cat.subcategories.map((sub) => ({
                        ...sub,
                        _id: sub.id,
                    })),
                };
            });
            return {
                categories: mapped,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                },
            };
        }
        const categories = await this.prisma.category.findMany({
            where,
            include: {
                subcategories: { where: { isDeleted: false } },
                products: { where: { isDeleted: false }, select: { id: true, metal: true } },
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        });
        return categories.map((cat) => {
            const categoryMetals = getCategoryMetals(cat);
            return {
                ...cat,
                _id: cat.id,
                metalIds: categoryMetals,
                metals: categoryMetals,
                productCount: cat.products.length,
                isActive: true,
                subcategories: cat.subcategories.map((sub) => ({
                    ...sub,
                    _id: sub.id,
                })),
            };
        });
    }
    async findBySlugOrId(identifier) {
        const category = await this.prisma.category.findFirst({
            where: {
                OR: [{ id: identifier }, { slug: identifier }],
                isDeleted: false,
            },
            include: {
                subcategories: { where: { isDeleted: false } },
                products: { where: { isDeleted: false, isPublished: true }, select: { id: true, metal: true } },
            },
        });
        if (!category) {
            throw new common_1.NotFoundException(`Category '${identifier}' not found.`);
        }
        const allActiveMetals = await this.prisma.metal.findMany({
            where: { isActive: true },
            select: { id: true, name: true, slug: true },
        });
        let categoryMetals = [];
        if (category.metalIds && Array.isArray(category.metalIds) && category.metalIds.length > 0) {
            categoryMetals = allActiveMetals
                .filter((m) => category.metalIds.includes(m.id))
                .map((m) => ({
                _id: m.id,
                id: m.id,
                name: m.name,
                slug: m.slug,
            }));
        }
        else {
            const metalMap = new Map();
            (category.products || []).forEach((p) => {
                if (p.metal) {
                    metalMap.set(p.metal.id, {
                        _id: p.metal.id,
                        id: p.metal.id,
                        name: p.metal.name,
                        slug: p.metal.slug,
                    });
                }
            });
            categoryMetals = Array.from(metalMap.values());
        }
        return {
            ...category,
            _id: category.id,
            metalIds: categoryMetals,
            metals: categoryMetals,
            isActive: true,
        };
    }
    async create(dto, file) {
        const rawName = typeof dto.name === 'string' ? dto.name.trim() : '';
        if (!rawName) {
            throw new common_1.ConflictException('Category name is required.');
        }
        const slug = (0, slugify_1.default)(rawName, { lower: true, strict: true }) || `cat-${Date.now()}`;
        const existing = await this.prisma.category.findFirst({
            where: { OR: [{ name: rawName }, { slug }], isDeleted: false },
        });
        if (existing) {
            throw new common_1.ConflictException('Category with this name already exists.');
        }
        let imageUrl = typeof dto.image === 'string' ? (0, storage_util_1.normalizeMediaKey)(dto.image) : null;
        if (file) {
            const uploadRes = await this.uploadsService.uploadAndCompressImage(file.buffer, file.originalname, file.mimetype, 'categories');
            imageUrl = (0, storage_util_1.normalizeMediaKey)(uploadRes.key);
        }
        const isFeatured = dto.isFeatured === true || dto.isFeatured === 'true';
        let metalIdsArray = [];
        if (dto.metalIds) {
            if (Array.isArray(dto.metalIds)) {
                metalIdsArray = dto.metalIds;
            }
            else if (typeof dto.metalIds === 'string') {
                metalIdsArray = dto.metalIds.split(',').map((id) => id.trim()).filter(Boolean);
            }
            else {
                metalIdsArray = [dto.metalIds];
            }
        }
        const category = await this.prisma.category.create({
            data: {
                name: rawName,
                slug,
                description: dto.description || null,
                image: imageUrl,
                isFeatured,
                metalIds: metalIdsArray,
            },
        });
        await this.redis.delPattern('cache:*').catch(() => null);
        return this.findBySlugOrId(category.id);
    }
    async update(id, dto, file) {
        const existing = await this.prisma.category.findFirst({
            where: { id, isDeleted: false },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Category with ID '${id}' not found.`);
        }
        const dataToUpdate = {};
        if (dto.name) {
            const rawName = dto.name.trim();
            if (rawName && rawName !== existing.name) {
                const slug = (0, slugify_1.default)(rawName, { lower: true, strict: true }) || `cat-${Date.now()}`;
                const duplicate = await this.prisma.category.findFirst({
                    where: { OR: [{ name: rawName }, { slug }], id: { not: id }, isDeleted: false },
                });
                if (duplicate) {
                    throw new common_1.ConflictException('Category with this name already exists.');
                }
                dataToUpdate.name = rawName;
                dataToUpdate.slug = slug;
            }
        }
        if (dto.description !== undefined) {
            dataToUpdate.description = dto.description;
        }
        if (dto.isFeatured !== undefined) {
            dataToUpdate.isFeatured = dto.isFeatured === true || dto.isFeatured === 'true';
        }
        if (dto.metalIds !== undefined) {
            let metalIdsArray = [];
            if (Array.isArray(dto.metalIds)) {
                metalIdsArray = dto.metalIds;
            }
            else if (typeof dto.metalIds === 'string') {
                metalIdsArray = dto.metalIds.split(',').map((mId) => mId.trim()).filter(Boolean);
            }
            else {
                metalIdsArray = [dto.metalIds];
            }
            dataToUpdate.metalIds = metalIdsArray;
        }
        if (file) {
            const uploadRes = await this.uploadsService.uploadAndCompressImage(file.buffer, file.originalname, file.mimetype, 'categories');
            dataToUpdate.image = (0, storage_util_1.normalizeMediaKey)(uploadRes.key);
        }
        else if (typeof dto.image === 'string') {
            dataToUpdate.image = (0, storage_util_1.normalizeMediaKey)(dto.image);
        }
        const updated = await this.prisma.category.update({
            where: { id },
            data: dataToUpdate,
        });
        await this.redis.delPattern('cache:*').catch(() => null);
        return this.findBySlugOrId(updated.id);
    }
    async delete(id) {
        const existing = await this.prisma.category.findFirst({
            where: { id, isDeleted: false },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Category with ID '${id}' not found.`);
        }
        await this.prisma.category.update({
            where: { id },
            data: { isDeleted: true },
        });
        await this.redis.delPattern('cache:*').catch(() => null);
        return { message: 'Category deleted successfully.' };
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        uploads_service_1.UploadsService,
        redis_service_1.RedisService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map