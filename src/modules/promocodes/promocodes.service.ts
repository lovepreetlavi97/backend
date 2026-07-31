import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromoCodesService {
  constructor(private readonly prisma: PrismaService) {}

  async validatePromoCode(code: string, totalAmount: number) {
    const promo = await this.prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo || !promo.isActive || new Date() > promo.validUntil) {
      throw new BadRequestException('Invalid or expired coupon promo code.');
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

  async createPromoCode(dto: { code: string; discountPercent: number; maxDiscount?: number; validUntil: Date }) {
    return this.prisma.promoCode.create({
      data: {
        code: dto.code.toUpperCase(),
        discountPercent: dto.discountPercent,
        maxDiscount: dto.maxDiscount,
        validUntil: dto.validUntil,
      },
    });
  }
}
