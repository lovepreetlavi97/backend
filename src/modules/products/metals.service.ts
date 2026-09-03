import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { CreateMetalDto, UpdateMetalDto } from './dto/metal.dto';

export interface MetalLinkedInfo {
  activeProducts: number;
  totalProducts: number;
  banners: number;
  isLinked: boolean;
}

@Injectable()
export class MetalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private mapMetal(metal: any, links?: MetalLinkedInfo) {
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

  async getMetalLinkedCounts(metalId: string, metalSlug?: string): Promise<MetalLinkedInfo> {
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

  async getMetals(status?: string) {
    const where: any = {};
    if (status === 'all') {
      // Admin requested all metals
    } else if (status === 'inactive') {
      where.isActive = false;
    } else {
      // Default: only active metals
      where.isActive = true;
    }

    const metals = await this.prisma.metal.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    // Fetch product link counts for all metals in parallel
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

    const productCountMap = new Map<string, number>();
    for (const item of productCounts) {
      if (item.metalId) productCountMap.set(item.metalId, item._count.id);
    }

    const activeProductCountMap = new Map<string, number>();
    for (const item of activeProductCounts) {
      if (item.metalId) activeProductCountMap.set(item.metalId, item._count.id);
    }

    return metals.map((m) => {
      const totalProducts = productCountMap.get(m.id) || 0;
      const activeProducts = activeProductCountMap.get(m.id) || 0;
      const bannersCount = activeBanners.filter(
        (b) => b.metalIds?.includes(m.id) || b.metalIds?.includes(m.slug)
      ).length;

      const links: MetalLinkedInfo = {
        activeProducts,
        totalProducts,
        banners: bannersCount,
        isLinked: totalProducts > 0 || bannersCount > 0,
      };

      return this.mapMetal(m, links);
    });
  }

  async getMetal(id: string) {
    const metal = await this.prisma.metal.findUnique({
      where: { id },
    });

    if (!metal) {
      throw new NotFoundException(`Metal with ID '${id}' not found.`);
    }

    const links = await this.getMetalLinkedCounts(metal.id, metal.slug);
    return this.mapMetal(metal, links);
  }

  async createMetal(dto: CreateMetalDto) {
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

  async updateMetal(id: string, dto: UpdateMetalDto) {
    const existing = await this.prisma.metal.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Metal with ID '${id}' not found.`);
    }

    // Protection: If trying to deactivate/block the metal (isActive: false), check if linked to any products or banners
    if (dto.isActive === false && existing.isActive === true) {
      const links = await this.getMetalLinkedCounts(id, existing.slug);
      if (links.activeProducts > 0 || links.banners > 0) {
        const reasons: string[] = [];
        if (links.activeProducts > 0) reasons.push(`${links.activeProducts} active product(s)`);
        if (links.banners > 0) reasons.push(`${links.banners} banner(s)`);
        throw new BadRequestException(
          `Cannot deactivate or block metal "${existing.name}". It is currently linked to ${reasons.join(' and ')}. Please reassign or delete the linked products/banners before blocking this metal.`
        );
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

    // Invalidate Redis cache so all linked products recalculate their live daily price immediately
    await this.redis.delPattern('cache:*').catch(() => null);

    const links = await this.getMetalLinkedCounts(metal.id, metal.slug);
    return this.mapMetal(metal, links);
  }

  async deleteMetal(id: string) {
    const existing = await this.prisma.metal.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Metal with ID '${id}' not found.`);
    }

    // Protection: Check if linked to any product or banner
    const links = await this.getMetalLinkedCounts(id, existing.slug);
    if (links.isLinked) {
      const reasons: string[] = [];
      if (links.totalProducts > 0) reasons.push(`${links.totalProducts} product(s)`);
      if (links.banners > 0) reasons.push(`${links.banners} banner(s)`);
      throw new BadRequestException(
        `Cannot delete metal "${existing.name}". It is currently linked to ${reasons.join(' and ')}. Please remove or reassign the linked items before deleting this metal.`
      );
    }

    await this.prisma.metal.delete({ where: { id } });
    await this.redis.delPattern('cache:*').catch(() => null);
  }
}
