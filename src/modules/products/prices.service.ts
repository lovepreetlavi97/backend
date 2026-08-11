import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePriceRuleDto, UpdatePriceRuleDto } from './dto/price-rule.dto';

@Injectable()
export class PricesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPriceRules(pageStr: string = '1', limitStr: string = '10', search?: string) {
    const pageNum = parseInt(pageStr, 10) || 1;
    const limitNum = parseInt(limitStr, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
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

  async createPriceRule(dto: CreatePriceRuleDto) {
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

  async updatePriceRule(id: string, dto: UpdatePriceRuleDto) {
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

  async deletePriceRule(id: string) {
    await this.prisma.priceRule.delete({ where: { id } }).catch(() => null);
  }
}
