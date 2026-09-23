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
const slugify_1 = require("slugify");
let CategoriesService = class CategoriesService {
    constructor(prisma, uploadsService) {
        this.prisma = prisma;
        this.uploadsService = uploadsService;
    }
    async findAll(params) {
        const page = params?.page ? Number(params.page) : undefined;
        const limit = params?.limit ? Number(params.limit) : undefined;
        const where = { isDeleted: false };
        if (params?.search) {
            where.name = { contains: params.search, mode: 'insensitive' };
        }
        if (page && limit) {
            const skip = (page - 1) * limit;
            const [categories, total] = await Promise.all([
                this.prisma.category.findMany({
                    where,
                    include: { subcategories: { where: { isDeleted: false } } },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                this.prisma.category.count({ where }),
            ]);
            const mapped = categories.map((cat) => ({
                ...cat,
                _id: cat.id,
                metalIds: [],
                isActive: true,
                subcategories: cat.subcategories.map((sub) => ({
                    ...sub,
                    _id: sub.id,
                })),
            }));
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
            include: { subcategories: { where: { isDeleted: false } } },
            orderBy: { name: 'asc' },
        });
        return categories.map((cat) => ({
            ...cat,
            _id: cat.id,
            metalIds: [],
            isActive: true,
            subcategories: cat.subcategories.map((sub) => ({
                ...sub,
                _id: sub.id,
            })),
        }));
    }
    async findBySlugOrId(identifier) {
        const category = await this.prisma.category.findFirst({
            where: {
                OR: [{ id: identifier }, { slug: identifier }],
                isDeleted: false,
            },
            include: {
                subcategories: { where: { isDeleted: false } },
                products: { where: { isDeleted: false, isPublished: true } },
            },
        });
        if (!category) {
            throw new common_1.NotFoundException(`Category '${identifier}' not found.`);
        }
        return {
            ...category,
            _id: category.id,
            metalIds: [],
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
        let imageUrl = typeof dto.image === 'string' ? dto.image : null;
        if (file) {
            const uploadRes = await this.uploadsService.uploadAndCompressImage(file.buffer, file.originalname, file.mimetype, 'categories');
            imageUrl = uploadRes.key;
        }
        const isFeatured = dto.isFeatured === true || dto.isFeatured === 'true';
        const category = await this.prisma.category.create({
            data: {
                name: rawName,
                slug,
                description: dto.description || null,
                image: imageUrl,
                isFeatured,
            },
        });
        return {
            ...category,
            _id: category.id,
            metalIds: [],
            isActive: true,
        };
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
        if (file) {
            const uploadRes = await this.uploadsService.uploadAndCompressImage(file.buffer, file.originalname, file.mimetype, 'categories');
            dataToUpdate.image = uploadRes.key;
        }
        else if (typeof dto.image === 'string') {
            dataToUpdate.image = dto.image;
        }
        const updated = await this.prisma.category.update({
            where: { id },
            data: dataToUpdate,
        });
        return {
            ...updated,
            _id: updated.id,
            metalIds: [],
            isActive: true,
        };
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
        return { message: 'Category deleted successfully.' };
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        uploads_service_1.UploadsService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map