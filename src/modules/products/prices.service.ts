import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { CreatePriceRuleDto, UpdatePriceRuleDto } from './dto/price-rule.dto';

@Injectable()
export class PricesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async getPriceRules(pageStr: string = '1', limitStr: string = '50', search?: string) {
    const pageNum = parseInt(pageStr, 10) || 1;
    const limitNum = parseInt(limitStr, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
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

    const countMap = new Map<string, number>();
    for (const item of productCounts) {
      if (item.priceRuleId) countMap.set(item.priceRuleId, item._count.id);
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

  async getPriceRuleById(id: string) {
    const rule = await this.prisma.priceRule.findUnique({
      where: { id },
    });
    if (!rule) {
      throw new NotFoundException(`Price rule with ID '${id}' not found.`);
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

  async createPriceRule(dto: CreatePriceRuleDto) {
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

    // Invalidate product caches so dynamic pricing updates everywhere
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

  async updatePriceRule(id: string, dto: UpdatePriceRuleDto) {
    const existing = await this.prisma.priceRule.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Price rule with ID '${id}' not found.`);
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

    // Invalidate Redis caches so that all linked products calculate their new dynamic price live
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

  async deletePriceRule(id: string) {
    const existing = await this.prisma.priceRule.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Price rule with ID '${id}' not found.`);
    }

    // Protection: Verify if linked to any products
    const linkedCount = await this.prisma.product.count({
      where: { priceRuleId: id, isDeleted: false },
    });

    if (linkedCount > 0) {
      throw new BadRequestException(
        `Cannot delete Price Rule "${existing.name}". It is currently linked to ${linkedCount} product(s). Please reassign or remove the linked products before deleting this price rule.`
      );
    }

    await this.prisma.priceRule.delete({ where: { id } });
    await this.redis.del('cache:homepage').catch(() => null);
  }

  async toggleStatus(id: string) {
    const existing = await this.prisma.priceRule.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Price rule with ID '${id}' not found.`);
    }

    return {
      status: 'success',
      message: 'Status updated successfully.',
    };
  }
}
