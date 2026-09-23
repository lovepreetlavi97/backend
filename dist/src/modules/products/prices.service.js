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
let PricesService = class PricesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPriceRules(pageStr = '1', limitStr = '10', search) {
        const pageNum = parseInt(pageStr, 10) || 1;
        const limitNum = parseInt(limitStr, 10) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        const [total, rules] = await Promise.all([
            this.prisma.priceRule.count({ where }),
            this.prisma.priceRule.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { updatedAt: 'desc' },
            }),
        ]);
        const formattedRules = rules.map((rule) => ({
            _id: rule.id,
            name: rule.name,
            price: Number(rule.makingChargeGram),
            makingChargeGram: Number(rule.makingChargeGram),
            gstPercentage: Number(rule.gstPercentage),
            discountPercent: Number(rule.discountPercent),
            isActive: true,
            createdAt: rule.updatedAt.toISOString(),
            updatedAt: rule.updatedAt.toISOString(),
        }));
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
    async createPriceRule(dto) {
        const makingCharge = dto.makingChargeGram || dto.price || 450;
        const rule = await this.prisma.priceRule.create({
            data: {
                name: dto.name,
                makingChargeGram: makingCharge,
                gstPercentage: dto.gstPercentage || 3.0,
                discountPercent: dto.discountPercent || 0.0,
            },
        });
        return {
            _id: rule.id,
            name: rule.name,
            price: Number(rule.makingChargeGram),
            isActive: true,
        };
    }
    async updatePriceRule(id, dto) {
        const makingCharge = dto.makingChargeGram || dto.price;
        const rule = await this.prisma.priceRule.update({
            where: { id },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(makingCharge !== undefined && { makingChargeGram: makingCharge }),
            },
        });
        return rule;
    }
    async deletePriceRule(id) {
        await this.prisma.priceRule.delete({ where: { id } }).catch(() => null);
    }
};
exports.PricesService = PricesService;
exports.PricesService = PricesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PricesService);
//# sourceMappingURL=prices.service.js.map