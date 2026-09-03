import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import slugify from 'slugify';
import * as crypto from 'crypto';

export interface CalculatedProductPrice {
  isPriceFixed: boolean;
  metalRatePerGram: number;
  weightGrams: number;
  baseMetalPrice: number;
  makingChargeGram: number;
  totalMakingCharge: number;
  priceBeforeTax: number;
  gstAmount: number;
  discountAmount: number;
  finalPrice: number;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  calculatePrice(
    weightGrams: number,
    ratePerGram: number,
    isPriceFixed: boolean = false,
    actualPrice?: number | null,
    discountedPrice?: number | null,
  ): CalculatedProductPrice {
    const weight = Number(weightGrams || 0);
    const rate = Number(ratePerGram || 0);

    // FIXED PRICING MODE
    if (isPriceFixed && actualPrice && Number(actualPrice) > 0) {
      const regular = Number(actualPrice);
      const sale = discountedPrice && Number(discountedPrice) > 0 ? Number(discountedPrice) : regular;
      const discount = Math.max(0, regular - sale);

      return {
        isPriceFixed: true,
        metalRatePerGram: rate,
        weightGrams: weight,
        baseMetalPrice: regular,
        makingChargeGram: 0,
        totalMakingCharge: 0,
        priceBeforeTax: regular,
        gstAmount: 0,
        discountAmount: discount,
        finalPrice: sale,
      };
    }

    // DYNAMIC DAILY METAL RATE MODE: Weight (e.g. 3g) * Metal Rate (e.g. ₹7,200/g) = ₹21,600
    const dynamicTotal = Math.round(weight * rate * 100) / 100;

    return {
      isPriceFixed: false,
      metalRatePerGram: rate,
      weightGrams: weight,
      baseMetalPrice: dynamicTotal,
      makingChargeGram: 0,
      totalMakingCharge: 0,
      priceBeforeTax: dynamicTotal,
      gstAmount: 0,
      discountAmount: 0,
      finalPrice: dynamicTotal,
    };
  }

  async findBySlug(slug: string) {
    const cacheKey = `cache:product:${slug}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        subcategory: true,
        metal: true,
        priceRule: true,
        reviews: true,
      },
    });

    if (!product || product.isDeleted || !product.isPublished) {
      throw new NotFoundException(`Product with slug '${slug}' not found.`);
    }

    const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 7200;

    const priceBreakdown = this.calculatePrice(
      Number(product.weightGrams || 0),
      ratePerGram,
      product.isPriceFixed,
      product.actualPrice ? Number(product.actualPrice) : null,
      product.discountedPrice ? Number(product.discountedPrice) : null,
    );

    const response = {
      ...product,
      calculatedPrice: priceBreakdown,
    };

    await this.redis.set(cacheKey, response, 300).catch(() => null);
    return response;
  }

  async invalidateProductCache(slug?: string) {
    if (slug) {
      await this.redis.del(`cache:product:${slug}`).catch(() => null);
    }
    await this.redis.delPattern('cache:*').catch(() => null);
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    collectionId?: string;
    metalId?: string;
  }) {
    const page = Math.max(1, Number(params.page || 1));
    const limit = Math.max(1, Number(params.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {
      isDeleted: false,
    };

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params.collectionId) {
      where.subcategoryId = params.collectionId;
    }

    if (params.metalId) {
      where.metalId = params.metalId;
    }

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          subcategory: true,
          metal: true,
          priceRule: true,
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const mappedProducts = products.map((product) => {
      const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 7200;

      const priceBreakdown = this.calculatePrice(
        Number(product.weightGrams || 0),
        ratePerGram,
        product.isPriceFixed,
        product.actualPrice ? Number(product.actualPrice) : null,
        product.discountedPrice ? Number(product.discountedPrice) : null,
      );

      const safeImages = Array.isArray(product.images) ? product.images : [];

      return {
        _id: product.id,
        id: product.id,
        name: product.title,
        title: product.title,
        slug: product.slug,
        sku: product.sku,
        description: product.description,
        image: safeImages[0] || '',
        mainImage: safeImages[0] || '',
        images: safeImages,
        weight: Number(product.weightGrams),
        stock: product.stockQuantity,
        stockQuantity: product.stockQuantity,
        isFeatured: product.isFeatured,
        isPublished: product.isPublished,
        isDeleted: product.isDeleted,
        isBlocked: !product.isPublished,
        isPriceFixed: product.isPriceFixed,
        actualPrice: priceBreakdown.finalPrice,
        discountedPrice: priceBreakdown.finalPrice,
        categoryId: product.category ? { _id: product.category.id, name: product.category.name, slug: product.category.slug } : null,
        subcategoryId: product.subcategory ? { _id: product.subcategory.id, name: product.subcategory.name, slug: product.subcategory.slug } : null,
        collectionIds: product.subcategory ? [{ _id: product.subcategory.id, name: product.subcategory.name, slug: product.subcategory.slug }] : [],
        metalIds: product.metal ? [{ _id: product.metal.id, name: product.metal.name, slug: product.metal.slug }] : [],
        metalId: product.metalId,
        priceRuleId: product.priceRuleId,
        calculatedPrice: priceBreakdown,
        category: product.category,
        subcategory: product.subcategory,
        metal: product.metal,
        priceRule: product.priceRule,
      };
    });

    return {
      status: 'success',
      data: {
        products: mappedProducts,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    };
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: true,
        metal: true,
        priceRule: true,
        reviews: true,
      },
    });

    if (!product || product.isDeleted) {
      throw new NotFoundException(`Product with ID '${id}' not found.`);
    }

    const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 7200;

    const priceBreakdown = this.calculatePrice(
      Number(product.weightGrams || 0),
      ratePerGram,
      product.isPriceFixed,
      product.actualPrice ? Number(product.actualPrice) : null,
      product.discountedPrice ? Number(product.discountedPrice) : null,
    );

    const safeImages = Array.isArray(product.images) ? product.images : [];

    return {
      _id: product.id,
      id: product.id,
      name: product.title,
      title: product.title,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      image: safeImages[0] || '',
      mainImage: safeImages[0] || '',
      images: safeImages,
      weight: Number(product.weightGrams),
      stock: product.stockQuantity,
      stockQuantity: product.stockQuantity,
      isFeatured: product.isFeatured,
      isPublished: product.isPublished,
      isDeleted: product.isDeleted,
      isBlocked: !product.isPublished,
      isPriceFixed: product.isPriceFixed,
      actualPrice: priceBreakdown.finalPrice,
      discountedPrice: priceBreakdown.finalPrice,
      categoryId: product.category ? { _id: product.category.id, name: product.category.name, slug: product.category.slug } : null,
      subcategoryId: product.subcategory ? { _id: product.subcategory.id, name: product.subcategory.name, slug: product.subcategory.slug } : null,
      collectionIds: product.subcategory ? [{ _id: product.subcategory.id, name: product.subcategory.name, slug: product.subcategory.slug }] : [],
      metalIds: product.metal ? [{ _id: product.metal.id, name: product.metal.name, slug: product.metal.slug }] : [],
      metalId: product.metalId,
      priceRuleId: product.priceRuleId,
      calculatedPrice: priceBreakdown,
      category: product.category,
      subcategory: product.subcategory,
      metal: product.metal,
      priceRule: product.priceRule,
    };
  }

  async create(dto: any) {
    const title = dto.title || dto.name || 'Untitled Product';
    const slug = slugify(title, { lower: true, strict: true }) + '-' + crypto.randomBytes(3).toString('hex');
    const cleanPrefix = title.toUpperCase().replace(/[^A-Z]/g, '');
    const prefix = cleanPrefix.length > 0 ? cleanPrefix.slice(0, 4) : 'PRD';
    const sku = dto.sku || `MYG-${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const weightGrams = dto.weightGrams !== undefined ? Number(dto.weightGrams) : (dto.weight !== undefined ? Number(dto.weight) : 0);
    const stockQuantity = dto.stockQuantity !== undefined ? parseInt(dto.stockQuantity, 10) : (dto.stock !== undefined ? parseInt(dto.stock, 10) : 0);
    const metalId = dto.metalId || (dto.metalIds && dto.metalIds.length > 0 ? dto.metalIds[0] : undefined);
    const categoryId = dto.categoryId || dto.category || undefined;

    const isPriceFixed = dto.isPriceFixed === true || dto.isPriceFixed === 'true';
    const actualPrice = dto.actualPrice !== undefined && dto.actualPrice !== null && dto.actualPrice !== '' ? Number(dto.actualPrice) : null;
    const discountedPrice = dto.discountedPrice !== undefined && dto.discountedPrice !== null && dto.discountedPrice !== '' ? Number(dto.discountedPrice) : null;

    const created = await this.prisma.product.create({
      data: {
        title,
        slug,
        sku,
        description: dto.description || '',
        images: dto.images || [],
        weightGrams,
        stockQuantity,
        categoryId,
        subcategoryId: dto.subcategoryId || undefined,
        metalId,
        priceRuleId: dto.priceRuleId || undefined,
        isPriceFixed,
        actualPrice,
        discountedPrice,
        isFeatured: dto.isFeatured === 'true' || dto.isFeatured === true,
        isPublished: dto.isPublished !== undefined
          ? (dto.isPublished === 'true' || dto.isPublished === true)
          : (dto.tags !== 'Draft'),
      },
    });

    await this.invalidateProductCache(created.slug);
    return created;
  }

  async update(id: string, dto: any) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.isDeleted) {
      throw new NotFoundException(`Product with ID '${id}' not found.`);
    }

    const data: any = {};
    if (dto.title !== undefined || dto.name !== undefined) {
      data.title = dto.title || dto.name;
    }
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.images !== undefined) data.images = dto.images;
    
    if (dto.weightGrams !== undefined || dto.weight !== undefined) {
      data.weightGrams = dto.weightGrams !== undefined ? Number(dto.weightGrams) : Number(dto.weight);
    }
    if (dto.stockQuantity !== undefined || dto.stock !== undefined) {
      data.stockQuantity = dto.stockQuantity !== undefined ? parseInt(dto.stockQuantity, 10) : parseInt(dto.stock, 10);
    }
    if (dto.categoryId !== undefined || dto.category !== undefined) {
      data.categoryId = dto.categoryId || dto.category || null;
    }
    if (dto.subcategoryId !== undefined) data.subcategoryId = dto.subcategoryId || null;
    
    if (dto.metalId !== undefined || dto.metalIds !== undefined) {
      data.metalId = dto.metalId || (dto.metalIds && dto.metalIds.length > 0 ? dto.metalIds[0] : null);
    }
    if (dto.priceRuleId !== undefined) data.priceRuleId = dto.priceRuleId || null;

    if (dto.isPriceFixed !== undefined) {
      data.isPriceFixed = dto.isPriceFixed === true || dto.isPriceFixed === 'true';
    }
    if (dto.actualPrice !== undefined) {
      data.actualPrice = dto.actualPrice !== null && dto.actualPrice !== '' ? Number(dto.actualPrice) : null;
    }
    if (dto.discountedPrice !== undefined) {
      data.discountedPrice = dto.discountedPrice !== null && dto.discountedPrice !== '' ? Number(dto.discountedPrice) : null;
    }

    if (dto.isFeatured !== undefined) data.isFeatured = dto.isFeatured === 'true' || dto.isFeatured === true;
    if (dto.isPublished !== undefined) data.isPublished = dto.isPublished === 'true' || dto.isPublished === true;

    const updated = await this.prisma.product.update({
      where: { id },
      data,
    });

    await this.invalidateProductCache(product.slug);
    return updated;
  }

  async delete(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.isDeleted) {
      throw new NotFoundException(`Product with ID '${id}' not found.`);
    }

    await this.prisma.product.update({
      where: { id },
      data: { isDeleted: true },
    });

    await this.invalidateProductCache(product.slug);
  }

  async toggleBlock(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.isDeleted) {
      throw new NotFoundException(`Product with ID '${id}' not found.`);
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: { isPublished: !product.isPublished },
    });

    await this.invalidateProductCache(product.slug);
    return updated;
  }
}
