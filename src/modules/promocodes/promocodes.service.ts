import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromoCodesService {
  constructor(private readonly prisma: PrismaService) {}

  private mapPromo(p: any) {
    const isExpired = new Date() > new Date(p.validUntil);
    const status = !p.isActive ? 'inactive' : isExpired ? 'expired' : 'active';

    return {
      _id: p.id,
      id: p.id,
      code: p.code,
      type: 'percentage',
      value: Number(p.discountPercent),
      discountPercent: Number(p.discountPercent),
      maxDiscount: p.maxDiscount ? Number(p.maxDiscount) : 0,
      minPurchase: 0,
      minOrderValue: 0,
      startDate: p.createdAt.toISOString(),
      endDate: p.validUntil.toISOString(),
      validUntil: p.validUntil.toISOString(),
      usageLimit: 1000,
      usageCount: 0,
      description: `${p.discountPercent}% OFF coupon discount`,
      status,
      isActive: p.isActive,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.createdAt.toISOString(),
    };
  }

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

  async getActivePromos() {
    let promos = await this.prisma.promoCode.findMany({
      where: {
        isActive: true,
        validUntil: { gte: new Date() },
      },
      orderBy: { discountPercent: 'desc' },
    });

    if (promos.length === 0) {
      // Auto seed default initial coupons
      const defaultPromos = [
        { code: 'GURU10', discountPercent: 10, maxDiscount: 2500, validUntil: new Date('2028-12-31') },
        { code: 'GURU5', discountPercent: 5, maxDiscount: 1500, validUntil: new Date('2028-12-31') },
        { code: 'FESTIVE500', discountPercent: 7, maxDiscount: 500, validUntil: new Date('2028-12-31') },
      ];

      for (const p of defaultPromos) {
        await this.prisma.promoCode.upsert({
          where: { code: p.code },
          update: { isActive: true },
          create: p,
        });
      }

      promos = await this.prisma.promoCode.findMany({
        where: { isActive: true },
      });
    }

    return promos.map((p) => this.mapPromo(p));
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    // Seed initial coupons if none exist
    await this.getActivePromos();

    const page = Math.max(1, Number(params?.page || 1));
    const limit = Math.max(1, Number(params?.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.search && params.search.trim()) {
      where.code = { contains: params.search.trim(), mode: 'insensitive' };
    }
    if (params?.status && params.status !== 'all') {
      if (params.status === 'active') {
        where.isActive = true;
        where.validUntil = { gte: new Date() };
      } else if (params.status === 'inactive') {
        where.isActive = false;
      } else if (params.status === 'expired') {
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

  async findById(id: string) {
    const promo = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException(`Promo code with ID '${id}' not found.`);
    return this.mapPromo(promo);
  }

  async createPromoCode(dto: {
    code: string;
    discountPercent?: number;
    value?: number;
    maxDiscount?: number;
    validUntil?: Date | string;
    endDate?: Date | string;
    isActive?: boolean;
  }) {
    const code = (dto.code || '').trim().toUpperCase();
    const discount = dto.discountPercent !== undefined ? Number(dto.discountPercent) : Number(dto.value || 10);
    const validUntilDate = dto.validUntil
      ? new Date(dto.validUntil)
      : dto.endDate
      ? new Date(dto.endDate)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    const promo = await this.prisma.promoCode.create({
      data: {
        code,
        discountPercent: discount,
        maxDiscount: dto.maxDiscount ? Number(dto.maxDiscount) : null,
        validUntil: validUntilDate,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    return this.mapPromo(promo);
  }

  async updatePromoCode(id: string, dto: any) {
    const existing = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Promo code not found`);

    const data: any = {};
    if (dto.code) data.code = dto.code.trim().toUpperCase();
    if (dto.discountPercent !== undefined || dto.value !== undefined) {
      data.discountPercent = Number(dto.discountPercent !== undefined ? dto.discountPercent : dto.value);
    }
    if (dto.maxDiscount !== undefined) {
      data.maxDiscount = Number(dto.maxDiscount);
    }
    if (dto.validUntil || dto.endDate) {
      data.validUntil = new Date(dto.validUntil || dto.endDate);
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
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

  async deletePromoCode(id: string) {
    const existing = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Promo code not found`);

    await this.prisma.promoCode.delete({ where: { id } });
    return { success: true };
  }

  async toggleStatus(id: string) {
    const existing = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Promo code not found`);

    const updated = await this.prisma.promoCode.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    return this.mapPromo(updated);
  }
}
