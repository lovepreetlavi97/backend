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
exports.PromoCodesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PromoCodesService = class PromoCodesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    mapPromo(p) {
        const isExpired = new Date() > new Date(p.validUntil);
        const status = !p.isActive ? 'inactive' : isExpired ? 'expired' : 'active';
        return {
            _id: p.id,
            id: p.id,
            code: p.code,
            type: p.type || 'percentage',
            value: Number(p.discountPercent),
            discountPercent: Number(p.discountPercent),
            maxDiscount: p.maxDiscount ? Number(p.maxDiscount) : 0,
            minPurchase: p.minPurchase ? Number(p.minPurchase) : 0,
            minOrderValue: p.minPurchase ? Number(p.minPurchase) : 0,
            startDate: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
            endDate: p.validUntil ? p.validUntil.toISOString() : new Date().toISOString(),
            validUntil: p.validUntil ? p.validUntil.toISOString() : new Date().toISOString(),
            usageLimit: p.usageLimit || 1000,
            usageCount: p.usageCount || 0,
            description: p.description || `${p.discountPercent}% OFF coupon discount`,
            showInProductDetail: p.showInProductDetail !== undefined ? p.showInProductDetail : true,
            status,
            isActive: p.isActive,
            createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString(),
        };
    }
    async validatePromoCode(code, totalAmount = 0) {
        if (!code) {
            throw new common_1.BadRequestException('Coupon promo code is required.');
        }
        const promo = await this.prisma.promoCode.findUnique({
            where: { code: code.trim().toUpperCase() },
        });
        if (!promo || !promo.isActive || new Date() > promo.validUntil) {
            throw new common_1.BadRequestException('Invalid or expired coupon promo code.');
        }
        const discountPercentage = Number(promo.discountPercent);
        const isFixed = promo.type === 'fixed';
        let discountAmount = isFixed
            ? discountPercentage
            : (totalAmount * discountPercentage) / 100;
        if (promo.maxDiscount && discountAmount > Number(promo.maxDiscount)) {
            discountAmount = Number(promo.maxDiscount);
        }
        if (totalAmount > 0 && discountAmount > totalAmount) {
            discountAmount = totalAmount;
        }
        const finalAmount = Math.max(0, totalAmount - discountAmount);
        return {
            code: promo.code,
            discountPercent: discountPercentage,
            discountAmount: Math.round(discountAmount * 100) / 100,
            finalAmount: Math.round(finalAmount * 100) / 100,
            discountType: promo.type || 'percentage',
            discountValue: discountPercentage,
            maxDiscount: promo.maxDiscount ? Number(promo.maxDiscount) : 0,
            minOrderValue: promo.minPurchase ? Number(promo.minPurchase) : 0,
            description: promo.description || (isFixed ? `₹${discountPercentage} FLAT OFF` : `${discountPercentage}% OFF`),
            promo: {
                code: promo.code,
                discountType: promo.type || 'percentage',
                discountValue: discountPercentage,
                discountPercent: discountPercentage,
                maxDiscount: promo.maxDiscount ? Number(promo.maxDiscount) : 0,
                minOrderValue: promo.minPurchase ? Number(promo.minPurchase) : 0,
                description: promo.description || (isFixed ? `₹${discountPercentage} FLAT OFF` : `${discountPercentage}% OFF`),
            },
        };
    }
    async getActivePromos(onlyProductDetail = false) {
        const where = {
            isActive: true,
            validUntil: { gte: new Date() },
        };
        if (onlyProductDetail) {
            where.showInProductDetail = true;
        }
        let promos = await this.prisma.promoCode.findMany({
            where,
            orderBy: { discountPercent: 'desc' },
        });
        if (promos.length === 0 && !onlyProductDetail) {
            const defaultPromos = [
                { code: 'GURU10', discountPercent: 10, maxDiscount: 2500, description: 'Flat 10% Off on Gold Jewellery', showInProductDetail: true, validUntil: new Date('2028-12-31') },
                { code: 'GURU5', discountPercent: 5, maxDiscount: 1500, description: '5% Instant Discount for New Users', showInProductDetail: true, validUntil: new Date('2028-12-31') },
                { code: 'FESTIVE500', discountPercent: 7, maxDiscount: 500, description: 'Festive Season Special Discount', showInProductDetail: true, validUntil: new Date('2028-12-31') },
            ];
            for (const p of defaultPromos) {
                await this.prisma.promoCode.upsert({
                    where: { code: p.code },
                    update: { isActive: true },
                    create: p,
                });
            }
            promos = await this.prisma.promoCode.findMany({
                where,
                orderBy: { discountPercent: 'desc' },
            });
        }
        return promos.map((p) => this.mapPromo(p));
    }
    async findAll(params) {
        await this.getActivePromos();
        const page = Math.max(1, Number(params?.page || 1));
        const limit = Math.max(1, Number(params?.limit || 10));
        const skip = (page - 1) * limit;
        const where = {};
        if (params?.search && params.search.trim()) {
            where.code = { contains: params.search.trim(), mode: 'insensitive' };
        }
        if (params?.status && params.status !== 'all') {
            if (params.status === 'active') {
                where.isActive = true;
                where.validUntil = { gte: new Date() };
            }
            else if (params.status === 'inactive') {
                where.isActive = false;
            }
            else if (params.status === 'expired') {
                where.validUntil = { lt: new Date() };
            }
        }
        const [promos, total] = await Promise.all([
            this.prisma.promoCode.findMany({
                where,
                orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
                skip,
                take: limit,
            }),
            this.prisma.promoCode.count({ where }),
        ]);
        return {
            promoCodes: promos.map((p) => this.mapPromo(p)),
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit) || 1,
            },
        };
    }
    async findById(id) {
        const promo = await this.prisma.promoCode.findUnique({ where: { id } });
        if (!promo)
            throw new common_1.NotFoundException(`Promo code with ID '${id}' not found.`);
        return this.mapPromo(promo);
    }
    async createPromoCode(dto) {
        const code = (dto.code || '').trim().toUpperCase();
        const discount = dto.discountPercent !== undefined ? Number(dto.discountPercent) : Number(dto.value || 10);
        const validUntilDate = dto.validUntil
            ? new Date(dto.validUntil)
            : dto.endDate
                ? new Date(dto.endDate)
                : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        const showInProductDetail = dto.showInProductDetail !== undefined ? Boolean(dto.showInProductDetail) : true;
        const promo = await this.prisma.promoCode.create({
            data: {
                code,
                discountPercent: discount,
                maxDiscount: dto.maxDiscount ? Number(dto.maxDiscount) : null,
                minPurchase: dto.minPurchase !== undefined ? Number(dto.minPurchase) : (dto.minOrderValue !== undefined ? Number(dto.minOrderValue) : 0),
                type: dto.type || 'percentage',
                description: dto.description || `${discount}% OFF coupon discount`,
                showInProductDetail,
                usageLimit: dto.usageLimit ? Number(dto.usageLimit) : 1000,
                validUntil: validUntilDate,
                isActive: dto.isActive !== undefined ? Boolean(dto.isActive) : (dto.status ? dto.status === 'active' : true),
            },
        });
        return this.mapPromo(promo);
    }
    async updatePromoCode(id, dto) {
        const existing = await this.prisma.promoCode.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException(`Promo code not found`);
        const data = {};
        if (dto.code)
            data.code = dto.code.trim().toUpperCase();
        if (dto.discountPercent !== undefined || dto.value !== undefined) {
            data.discountPercent = Number(dto.discountPercent !== undefined ? dto.discountPercent : dto.value);
        }
        if (dto.maxDiscount !== undefined) {
            data.maxDiscount = dto.maxDiscount ? Number(dto.maxDiscount) : null;
        }
        if (dto.minPurchase !== undefined || dto.minOrderValue !== undefined) {
            data.minPurchase = Number(dto.minPurchase !== undefined ? dto.minPurchase : dto.minOrderValue);
        }
        if (dto.type !== undefined) {
            data.type = dto.type;
        }
        if (dto.description !== undefined) {
            data.description = dto.description;
        }
        if (dto.showInProductDetail !== undefined) {
            data.showInProductDetail = Boolean(dto.showInProductDetail);
        }
        if (dto.usageLimit !== undefined) {
            data.usageLimit = Number(dto.usageLimit);
        }
        if (dto.validUntil || dto.endDate) {
            data.validUntil = new Date(dto.validUntil || dto.endDate);
        }
        if (dto.isActive !== undefined) {
            data.isActive = Boolean(dto.isActive);
        }
        if (dto.status !== undefined) {
            data.isActive = dto.status === 'active';
        }
        const updated = await this.prisma.promoCode.update({
            where: { id },
            data,
        });
        return this.mapPromo(updated);
    }
    async deletePromoCode(id) {
        const existing = await this.prisma.promoCode.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException(`Promo code not found`);
        await this.prisma.promoCode.delete({ where: { id } });
        return { success: true };
    }
    async toggleStatus(id) {
        const existing = await this.prisma.promoCode.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException(`Promo code not found`);
        const updated = await this.prisma.promoCode.update({
            where: { id },
            data: { isActive: !existing.isActive },
        });
        return this.mapPromo(updated);
    }
    async toggleShowInProductDetail(id) {
        const existing = await this.prisma.promoCode.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException(`Promo code not found`);
        const updated = await this.prisma.promoCode.update({
            where: { id },
            data: { showInProductDetail: !existing.showInProductDetail },
        });
        return this.mapPromo(updated);
    }
};
exports.PromoCodesService = PromoCodesService;
exports.PromoCodesService = PromoCodesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PromoCodesService);
//# sourceMappingURL=promocodes.service.js.map