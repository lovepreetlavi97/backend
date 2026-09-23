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
    async validatePromoCode(code, totalAmount) {
        const promo = await this.prisma.promoCode.findUnique({
            where: { code: code.toUpperCase() },
        });
        if (!promo || !promo.isActive || new Date() > promo.validUntil) {
            throw new common_1.BadRequestException('Invalid or expired coupon promo code.');
        }
        const discountPercentage = Number(promo.discountPercent);
        let discountAmount = (totalAmount * discountPercentage) / 100;
        if (promo.maxDiscount && discountAmount > Number(promo.maxDiscount)) {
            discountAmount = Number(promo.maxDiscount);
        }
        const finalAmount = Math.max(0, totalAmount - discountAmount);
        return {
            code: promo.code,
            discountPercent: discountPercentage,
            discountAmount: Math.round(discountAmount * 100) / 100,
            finalAmount: Math.round(finalAmount * 100) / 100,
        };
    }
    async createPromoCode(dto) {
        return this.prisma.promoCode.create({
            data: {
                code: dto.code.toUpperCase(),
                discountPercent: dto.discountPercent,
                maxDiscount: dto.maxDiscount,
                validUntil: dto.validUntil,
            },
        });
    }
};
exports.PromoCodesService = PromoCodesService;
exports.PromoCodesService = PromoCodesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PromoCodesService);
//# sourceMappingURL=promocodes.service.js.map