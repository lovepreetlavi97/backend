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
exports.MetalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../../shared/redis/redis.service");
let MetalsService = class MetalsService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    mapMetal(metal, links) {
        return {
            _id: metal.id,
            name: metal.name,
            slug: metal.slug,
            colorCode: metal.colorCode,
            gradient: metal.gradient,
            isActive: metal.isActive,
            type: metal.type,
            ratePerGram: Number(metal.ratePerGram || 0),
            purity: metal.purity || '999',
            linkedProductsCount: links?.totalProducts ?? 0,
            activeProductsCount: links?.activeProducts ?? 0,
            linkedBannersCount: links?.banners ?? 0,
            isLinked: links?.isLinked ?? false,
            createdAt: metal.updatedAt.toISOString(),
            updatedAt: metal.updatedAt.toISOString(),
        };
    }
    async getMetalLinkedCounts(metalId, metalSlug) {
        const [activeProducts, totalProducts, banners] = await Promise.all([
            this.prisma.product.count({
                where: {
                    metalId: metalId,
                    isDeleted: false,
                },
            }),
            this.prisma.product.count({
                where: {
                    metalId: metalId,
                },
            }),
            this.prisma.banner.findMany({
                where: {
                    isDeleted: false,
                    OR: [
                        { metalIds: { has: metalId } },
                        ...(metalSlug ? [{ metalIds: { has: metalSlug } }] : []),
                    ],
                },
            }),
        ]);
        const bannerCount = banners.length;
        const isLinked = totalProducts > 0 || bannerCount > 0;
        return {
            activeProducts,
            totalProducts,
            banners: bannerCount,
            isLinked,
        };
    }
    async getMetals(status) {
        const where = {};
        if (status === 'all') {
        }
        else if (status === 'inactive') {
            where.isActive = false;
        }
        else {
            where.isActive = true;
        }
        const metals = await this.prisma.metal.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
        });
        const productCounts = await this.prisma.product.groupBy({
            by: ['metalId'],
            _count: { id: true },
            where: { metalId: { not: null } },
        });
        const activeProductCounts = await this.prisma.product.groupBy({
            by: ['metalId'],
            _count: { id: true },
            where: { metalId: { not: null }, isDeleted: false },
        });
        const activeBanners = await this.prisma.banner.findMany({
            where: { isDeleted: false },
            select: { metalIds: true },
        });
        const productCountMap = new Map();
        for (const item of productCounts) {
            if (item.metalId)
                productCountMap.set(item.metalId, item._count.id);
        }
        const activeProductCountMap = new Map();
        for (const item of activeProductCounts) {
            if (item.metalId)
                activeProductCountMap.set(item.metalId, item._count.id);
        }
        return metals.map((m) => {
            const totalProducts = productCountMap.get(m.id) || 0;
            const activeProducts = activeProductCountMap.get(m.id) || 0;
            const bannersCount = activeBanners.filter((b) => b.metalIds?.includes(m.id) || b.metalIds?.includes(m.slug)).length;
            const links = {
                activeProducts,
                totalProducts,
                banners: bannersCount,
                isLinked: totalProducts > 0 || bannersCount > 0,
            };
            return this.mapMetal(m, links);
        });
    }
    async getMetal(id) {
        const metal = await this.prisma.metal.findUnique({
            where: { id },
        });
        if (!metal) {
            throw new common_1.NotFoundException(`Metal with ID '${id}' not found.`);
        }
        const links = await this.getMetalLinkedCounts(metal.id, metal.slug);
        return this.mapMetal(metal, links);
    }
    async createMetal(dto) {
        const metal = await this.prisma.metal.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                colorCode: dto.colorCode || '#c5a059',
                gradient: dto.gradient || 'linear-gradient(to right, #c5a059, #e0c283)',
                ratePerGram: dto.ratePerGram !== undefined ? Number(dto.ratePerGram) : 0,
                purity: dto.purity || '999',
                isActive: dto.isActive !== undefined ? dto.isActive : true,
            },
        });
        await this.redis.delPattern('cache:*').catch(() => null);
        return this.mapMetal(metal);
    }
    async updateMetal(id, dto) {
        const existing = await this.prisma.metal.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Metal with ID '${id}' not found.`);
        }
        if (dto.isActive === false && existing.isActive === true) {
            const links = await this.getMetalLinkedCounts(id, existing.slug);
            if (links.activeProducts > 0 || links.banners > 0) {
                const reasons = [];
                if (links.activeProducts > 0)
                    reasons.push(`${links.activeProducts} active product(s)`);
                if (links.banners > 0)
                    reasons.push(`${links.banners} banner(s)`);
                throw new common_1.BadRequestException(`Cannot deactivate or block metal "${existing.name}". It is currently linked to ${reasons.join(' and ')}. Please reassign or delete the linked products/banners before blocking this metal.`);
            }
        }
        const metal = await this.prisma.metal.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.slug && { slug: dto.slug }),
                ...(dto.colorCode !== undefined && { colorCode: dto.colorCode }),
                ...(dto.gradient !== undefined && { gradient: dto.gradient }),
                ...(dto.ratePerGram !== undefined && { ratePerGram: Number(dto.ratePerGram) }),
                ...(dto.purity !== undefined && { purity: dto.purity }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            },
        });
        await this.redis.delPattern('cache:*').catch(() => null);
        const links = await this.getMetalLinkedCounts(metal.id, metal.slug);
        return this.mapMetal(metal, links);
    }
    async deleteMetal(id) {
        const existing = await this.prisma.metal.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new common_1.NotFoundException(`Metal with ID '${id}' not found.`);
        }
        const links = await this.getMetalLinkedCounts(id, existing.slug);
        if (links.isLinked) {
            const reasons = [];
            if (links.totalProducts > 0)
                reasons.push(`${links.totalProducts} product(s)`);
            if (links.banners > 0)
                reasons.push(`${links.banners} banner(s)`);
            throw new common_1.BadRequestException(`Cannot delete metal "${existing.name}". It is currently linked to ${reasons.join(' and ')}. Please remove or reassign the linked items before deleting this metal.`);
        }
        await this.prisma.metal.delete({ where: { id } });
        await this.redis.delPattern('cache:*').catch(() => null);
    }
};
exports.MetalsService = MetalsService;
exports.MetalsService = MetalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], MetalsService);
//# sourceMappingURL=metals.service.js.map