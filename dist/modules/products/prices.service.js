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
exports.PricesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../../shared/redis/redis.service");
let PricesService = class PricesService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    async getPriceRules(pageStr = '1', limitStr = '50', search) {
        const pageNum = parseInt(pageStr, 10) || 1;
        const limitNum = parseInt(limitStr, 10) || 50;
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        const [total, rules, productCounts] = await Promise.all([
            this.prisma.priceRule.count({ where }),
            this.prisma.priceRule.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { updatedAt: 'desc' },
            }),
            this.prisma.product.groupBy({
                by: ['priceRuleId'],
                _count: { id: true },
                where: { priceRuleId: { not: null }, isDeleted: false },
            }),
        ]);
        const countMap = new Map();
        for (const item of productCounts) {
            if (item.priceRuleId)
                countMap.set(item.priceRuleId, item._count.id);
        }
        const formattedRules = rules.map((rule) => {
            const linkedProductsCount = countMap.get(rule.id) || 0;
            return {
                _id: rule.id,
                name: rule.name,
                price: Number(rule.makingChargeGram),
                makingChargeGram: Number(rule.makingChargeGram),
                gstPercentage: Number(rule.gstPercentage),
                discountPercent: Number(rule.discountPercent),
                isActive: true,
                linkedProductsCount,
                isLinked: linkedProductsCount > 0,
                createdAt: rule.updatedAt.toISOString(),
                updatedAt: rule.updatedAt.toISOString(),
            };
        });
        return {
            priceRules: formattedRules,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum) || 1,
            },
        };
    }
    async getPriceRuleById(id) {
        const rule = await this.prisma.priceRule.findUnique({
            where: { id },
        });
        if (!rule) {
            throw new common_1.NotFoundException(`Price rule with ID '${id}' not found.`);
        }
        const linkedProductsCount = await this.prisma.product.count({
            where: { priceRuleId: id, isDeleted: false },
        });
        return {
            _id: rule.id,
            name: rule.name,
            price: Number(rule.makingChargeGram),
            makingChargeGram: Number(rule.makingChargeGram),
            gstPercentage: Number(rule.gstPercentage),
            discountPercent: Number(rule.discountPercent),
            isActive: true,
            linkedProductsCount,
            isLinked: linkedProductsCount > 0,
        };
    }
    async createPriceRule(dto) {
        const makingCharge = dto.makingChargeGram !== undefined ? dto.makingChargeGram : (dto.price !== undefined ? dto.price : 450);
        const gst = dto.gstPercentage !== undefined ? dto.gstPercentage : 3.0;
        const discount = dto.discountPercent !== undefined ? dto.discountPercent : 0.0;
        const rule = await this.prisma.priceRule.create({
            data: {
                name: dto.name,
                makingChargeGram: makingCharge,
                gstPercentage: gst,
                discountPercent: discount,
            },
        });
        await this.redis.del('cache:homepage').catch(() => null);
        return {
            _id: rule.id,
            name: rule.name,
            price: Number(rule.makingChargeGram),
            makingChargeGram: Number(rule.makingChargeGram),
            gstPercentage: Number(rule.gstPercentage),
            discountPercent: Number(rule.discountPercent),
            isActive: true,
        };
    }
    async updatePriceRule(id, dto) {
        const existing = await this.prisma.priceRule.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Price rule with ID '${id}' not found.`);
        }
        const makingCharge = dto.makingChargeGram !== undefined ? dto.makingChargeGram : dto.price;
        const rule = await this.prisma.priceRule.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(makingCharge !== undefined && { makingChargeGram: makingCharge }),
                ...(dto.gstPercentage !== undefined && { gstPercentage: dto.gstPercentage }),
                ...(dto.discountPercent !== undefined && { discountPercent: dto.discountPercent }),
            },
        });
        await this.redis.del('cache:homepage').catch(() => null);
        return {
            _id: rule.id,
            name: rule.name,
            price: Number(rule.makingChargeGram),
            makingChargeGram: Number(rule.makingChargeGram),
            gstPercentage: Number(rule.gstPercentage),
            discountPercent: Number(rule.discountPercent),
            isActive: true,
        };
    }
    async deletePriceRule(id) {
        const existing = await this.prisma.priceRule.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Price rule with ID '${id}' not found.`);
        }
        const linkedCount = await this.prisma.product.count({
            where: { priceRuleId: id, isDeleted: false },
        });
        if (linkedCount > 0) {
            throw new common_1.BadRequestException(`Cannot delete Price Rule "${existing.name}". It is currently linked to ${linkedCount} product(s). Please reassign or remove the linked products before deleting this price rule.`);
        }
        await this.prisma.priceRule.delete({ where: { id } });
        await this.redis.del('cache:homepage').catch(() => null);
    }
    async toggleStatus(id) {
        const existing = await this.prisma.priceRule.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException(`Price rule with ID '${id}' not found.`);
        }
        return {
            status: 'success',
            message: 'Status updated successfully.',
        };
    }
};
exports.PricesService = PricesService;
exports.PricesService = PricesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], PricesService);
//# sourceMappingURL=prices.service.js.map