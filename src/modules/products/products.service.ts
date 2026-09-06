
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import slugify from 'slugify';
import * as crypto from 'crypto';

export interface CalculatedProductPrice {
  isPriceFixed: boolean;
  metalRatePerGram: number;
  weightGrams: number;
  grossWeight: number;
  netGoldWeight: number;
  stoneWeight: number;
  baseMetalPrice: number;
  makingChargeGram: number;
  totalMakingCharge: number;
  wastagePercent: number;
  wastageAmount: number;
  hallmarkingFee: number;
  priceBeforeTax: number;
  gstPercent: number;
  gstAmount: number;
  discountAmount: number;
  finalPrice: number;
}

const isValidUUID = (str: any): boolean => {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
};

const sanitizeUUID = (val: any): string | null => {
  if (!val) return null;
  const str = typeof val === 'object' ? (val._id || val.id || '') : String(val);
  return isValidUUID(str) ? str.trim() : null;
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) { }

  calculatePrice(
    weightGrams: number,
    ratePerGram: number,
    isPriceFixed: boolean = false,
    actualPrice?: number | null,
    discountedPrice?: number | null,
    grossWeight?: number | null,
    netGoldWeight?: number | null,
    stoneWeight?: number | null,
    wastagePercentVal?: number | null,
    priceRule?: any,
  ): CalculatedProductPrice {
    const gross = grossWeight !== undefined && grossWeight !== null && Number(grossWeight) > 0
      ? Number(grossWeight)
      : Number(weightGrams || 0);

    const stone = stoneWeight !== undefined && stoneWeight !== null
      ? Number(stoneWeight)
      : 0;

    const netGold = netGoldWeight !== undefined && netGoldWeight !== null && Number(netGoldWeight) > 0
      ? Number(netGoldWeight)
      : Math.max(0, gross - stone);

    const weight = netGold > 0 ? netGold : gross;
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
        grossWeight: gross,
        netGoldWeight: netGold,
        stoneWeight: stone,
        baseMetalPrice: regular,
        makingChargeGram: 0,
        totalMakingCharge: 0,
        wastagePercent: 0,
        wastageAmount: 0,
        hallmarkingFee: 0,
        priceBeforeTax: regular,
        gstPercent: 0,
        gstAmount: 0,
        discountAmount: discount,
        finalPrice: sale,
      };
    }

    // DYNAMIC DAILY METAL RATE MODE
    const baseMetal = Math.ceil(weight * rate);
    const makingPerGram = priceRule ? Number(priceRule.makingChargeGram || 0) : 0;
    const totalMaking = Math.ceil(gross * makingPerGram);
    const wastagePct = wastagePercentVal ? Number(wastagePercentVal) : 0;
    const wastageAmt = Math.ceil(baseMetal * (wastagePct / 100));
    const hallmarking = 0; // BIS Hallmarking certification covered by business (₹0 to customer)

    const gstPct = priceRule ? Number(priceRule.gstPercentage || 3.0) : 3.0;
    const discountPct = priceRule ? Number(priceRule.discountPercent || 0.0) : 0.0;

    const subtotal = Math.ceil(baseMetal + totalMaking + wastageAmt + hallmarking);
    const discountAmt = Math.ceil(subtotal * (discountPct / 100));
    const taxableSubtotal = Math.max(0, subtotal - discountAmt);
    const gstAmt = Math.ceil(taxableSubtotal * (gstPct / 100));
    const finalPrice = Math.ceil(taxableSubtotal + gstAmt);

    return {
      isPriceFixed: false,
      metalRatePerGram: rate,
      weightGrams: weight,
      grossWeight: gross,
      netGoldWeight: netGold,
      stoneWeight: stone,
      baseMetalPrice: baseMetal,
      makingChargeGram: makingPerGram,
      totalMakingCharge: totalMaking,
      wastagePercent: wastagePct,
      wastageAmount: wastageAmt,
      hallmarkingFee: hallmarking,
      priceBeforeTax: subtotal,
      gstPercent: gstPct,
      gstAmount: gstAmt,
      discountAmount: discountAmt,
      finalPrice: finalPrice,
    };
  }

  mapProductRecord(product: any) {
    const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 7200;

    const priceBreakdown = this.calculatePrice(
      Number(product.weightGrams || 0),
      ratePerGram,
      product.isPriceFixed,
      product.actualPrice ? Number(product.actualPrice) : null,
      product.discountedPrice ? Number(product.discountedPrice) : null,
      product.grossWeight ? Number(product.grossWeight) : null,
      product.netGoldWeight ? Number(product.netGoldWeight) : null,
      product.stoneWeight ? Number(product.stoneWeight) : null,
      product.wastagePercent ? Number(product.wastagePercent) : null,
      product.priceRule,
    );

    const safeImages = Array.isArray(product.images) ? product.images : [];
    const festivalIds = Array.isArray(product.festivalIds) ? product.festivalIds : [];
    const relationIds = Array.isArray(product.relationIds) ? product.relationIds : [];
    const collectionIds = Array.isArray(product.collectionIds) ? product.collectionIds : [];

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
      weightGrams: Number(product.weightGrams),
      grossWeight: product.grossWeight ? Number(product.grossWeight) : Number(product.weightGrams),
      netGoldWeight: product.netGoldWeight ? Number(product.netGoldWeight) : Number(product.weightGrams),
      stoneWeight: product.stoneWeight ? Number(product.stoneWeight) : 0,
      purity: product.purity || '22KT',
      wastagePercent: product.wastagePercent ? Number(product.wastagePercent) : 0,
      bisHallmark: product.bisHallmark ?? true,
      stock: product.stockQuantity,
      stockQuantity: product.stockQuantity,
      isFeatured: product.isFeatured,
      isPublished: product.isPublished,
      isDeleted: product.isDeleted,
      isBlocked: !product.isPublished,
      isPriceFixed: product.isPriceFixed,
      actualPrice: priceBreakdown.finalPrice,
      discountedPrice: priceBreakdown.finalPrice,
      festivalIds,
      relationIds,
      collectionIds,
      attributes: product.attributes || {},
      specifications: product.specifications || [],
      categoryId: product.category ? { _id: product.category.id, name: product.category.name, slug: product.category.slug } : null,
      subcategoryId: product.subcategory ? { _id: product.subcategory.id, name: product.subcategory.name, slug: product.subcategory.slug } : null,
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

    const response = this.mapProductRecord(product);
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
    festivalId?: string;
    relationId?: string;
    occasion?: string;
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
      where.OR = [
        { subcategoryId: params.collectionId },
        { collectionIds: { has: params.collectionId } },
      ];
    }

    if (params.festivalId) {
      where.festivalIds = { has: params.festivalId };
    }

    if (params.relationId) {
      where.relationIds = { has: params.relationId };
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

    const mappedProducts = products.map((product) => this.mapProductRecord(product));

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

    return this.mapProductRecord(product);
  }

  async create(dto: any) {
    const title = dto.title || dto.name || 'Untitled Product';
    const slug = slugify(title, { lower: true, strict: true }) + '-' + crypto.randomBytes(3).toString('hex');
    const cleanPrefix = title.toUpperCase().replace(/[^A-Z]/g, '');
    const prefix = cleanPrefix.length > 0 ? cleanPrefix.slice(0, 4) : 'PRD';
    const sku = dto.sku || `MYG-${prefix}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const weightGrams = dto.weightGrams !== undefined ? Number(dto.weightGrams) : (dto.weight !== undefined ? Number(dto.weight) : 0);
    const stockQuantity = dto.stockQuantity !== undefined ? parseInt(dto.stockQuantity, 10) : (dto.stock !== undefined ? parseInt(dto.stock, 10) : 0);

    const isPriceFixed = dto.isPriceFixed === true || dto.isPriceFixed === 'true';
    const actualPrice = dto.actualPrice !== undefined && dto.actualPrice !== null && dto.actualPrice !== '' ? Number(dto.actualPrice) : null;
    const discountedPrice = dto.discountedPrice !== undefined && dto.discountedPrice !== null && dto.discountedPrice !== '' ? Number(dto.discountedPrice) : null;

    const grossWeight = dto.grossWeight !== undefined && dto.grossWeight !== '' ? Number(dto.grossWeight) : weightGrams;
    const netGoldWeight = dto.netGoldWeight !== undefined && dto.netGoldWeight !== '' ? Number(dto.netGoldWeight) : weightGrams;
    const stoneWeight = dto.stoneWeight !== undefined && dto.stoneWeight !== '' ? Number(dto.stoneWeight) : 0;
    const wastagePercent = dto.wastagePercent !== undefined && dto.wastagePercent !== '' ? Number(dto.wastagePercent) : 0;
    const purity = dto.purity || '22KT';
    const bisHallmark = dto.bisHallmark !== undefined ? (dto.bisHallmark === 'true' || dto.bisHallmark === true) : true;
    const categoryId = sanitizeUUID(dto.categoryId || dto.category);
    const subcategoryId = sanitizeUUID(dto.subcategoryId);
    const metalId = sanitizeUUID(dto.metalId || (dto.metalIds && dto.metalIds.length > 0 ? dto.metalIds[0] : null));
    const priceRuleId = sanitizeUUID(dto.priceRuleId);

    const festivalIds = Array.isArray(dto.festivalIds)
      ? dto.festivalIds.map((item: any) => typeof item === 'object' ? (item._id || item.id) : item).filter(Boolean)
      : (dto.festivals ? dto.festivals : []);
    const relationIds = Array.isArray(dto.relationIds)
      ? dto.relationIds.map((item: any) => typeof item === 'object' ? (item._id || item.id) : item).filter(Boolean)
      : (dto.relations ? dto.relations : []);
    const collectionIds = Array.isArray(dto.collectionIds)
      ? dto.collectionIds.map((item: any) => typeof item === 'object' ? (item._id || item.id) : item).filter(Boolean)
      : (dto.collections ? dto.collections : []);
    const attributes = dto.attributes && typeof dto.attributes === 'object' ? dto.attributes : {};
    const specifications = Array.isArray(dto.specifications) ? dto.specifications : [];

    // Collect all images from dto.images, dto.image, dto.mainImage
    let imagesList: string[] = [];
    if (Array.isArray(dto.images)) {
      imagesList = dto.images.filter((img: any) => typeof img === 'string' && img.trim().length > 0);
    } else if (typeof dto.images === 'string' && dto.images.trim().length > 0) {
      imagesList = [dto.images.trim()];
    }

    if (dto.image && typeof dto.image === 'string' && dto.image.trim().length > 0) {
      const cleanImg = dto.image.trim();
      if (!imagesList.includes(cleanImg)) {
        imagesList.unshift(cleanImg);
      }
    }
    if (dto.mainImage && typeof dto.mainImage === 'string' && dto.mainImage.trim().length > 0) {
      const cleanMain = dto.mainImage.trim();
      if (!imagesList.includes(cleanMain)) {
        imagesList.unshift(cleanMain);
      }
    }

    const created = await this.prisma.product.create({
      data: {
        title,
        slug,
        sku,
        description: dto.description || '',
        images: imagesList,
        weightGrams,
        grossWeight,
        netGoldWeight,
        stoneWeight,
        purity,
        wastagePercent,
        bisHallmark,
        stockQuantity,
        categoryId: categoryId || undefined,
        subcategoryId: subcategoryId || undefined,
        festivalIds,
        relationIds,
        collectionIds,
        attributes,
        specifications,
        metalId: metalId || undefined,
        priceRuleId: priceRuleId || undefined,
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
    
    if (dto.images !== undefined || dto.image !== undefined || dto.mainImage !== undefined) {
      let imagesList: string[] = [];
      if (Array.isArray(dto.images)) {
        imagesList = dto.images.filter((img: any) => typeof img === 'string' && img.trim().length > 0);
      } else if (typeof dto.images === 'string' && dto.images.trim().length > 0) {
        imagesList = [dto.images.trim()];
      }
      if (dto.image && typeof dto.image === 'string' && dto.image.trim().length > 0) {
        const cleanImg = dto.image.trim();
        if (!imagesList.includes(cleanImg)) {
          imagesList.unshift(cleanImg);
        }
      }
      if (dto.mainImage && typeof dto.mainImage === 'string' && dto.mainImage.trim().length > 0) {
        const cleanMain = dto.mainImage.trim();
        if (!imagesList.includes(cleanMain)) {
          imagesList.unshift(cleanMain);
        }
      }
      data.images = imagesList;
    }

    if (dto.weightGrams !== undefined || dto.weight !== undefined) {
      data.weightGrams = dto.weightGrams !== undefined ? Number(dto.weightGrams) : Number(dto.weight);
    }
    if (dto.grossWeight !== undefined) data.grossWeight = dto.grossWeight !== '' ? Number(dto.grossWeight) : null;
    if (dto.netGoldWeight !== undefined) data.netGoldWeight = dto.netGoldWeight !== '' ? Number(dto.netGoldWeight) : null;
    if (dto.stoneWeight !== undefined) data.stoneWeight = dto.stoneWeight !== '' ? Number(dto.stoneWeight) : 0;
    if (dto.purity !== undefined) data.purity = dto.purity;
    if (dto.wastagePercent !== undefined) data.wastagePercent = dto.wastagePercent !== '' ? Number(dto.wastagePercent) : 0;
    if (dto.bisHallmark !== undefined) data.bisHallmark = dto.bisHallmark === 'true' || dto.bisHallmark === true;

    if (dto.stockQuantity !== undefined || dto.stock !== undefined) {
      data.stockQuantity = dto.stockQuantity !== undefined ? parseInt(dto.stockQuantity, 10) : parseInt(dto.stock, 10);
    }
    if (dto.categoryId !== undefined || dto.category !== undefined) {
      data.categoryId = sanitizeUUID(dto.categoryId || dto.category);
    }
    if (dto.subcategoryId !== undefined) {
      data.subcategoryId = sanitizeUUID(dto.subcategoryId);
    }

    if (dto.festivalIds !== undefined) {
      data.festivalIds = Array.isArray(dto.festivalIds)
        ? dto.festivalIds.map((item: any) => typeof item === 'object' ? (item._id || item.id) : item).filter(Boolean)
        : [];
    }
    if (dto.relationIds !== undefined) {
      data.relationIds = Array.isArray(dto.relationIds)
        ? dto.relationIds.map((item: any) => typeof item === 'object' ? (item._id || item.id) : item).filter(Boolean)
        : [];
    }
    if (dto.collectionIds !== undefined) {
      data.collectionIds = Array.isArray(dto.collectionIds)
        ? dto.collectionIds.map((item: any) => typeof item === 'object' ? (item._id || item.id) : item).filter(Boolean)
        : [];
    }
    if (dto.attributes !== undefined) data.attributes = dto.attributes;
    if (dto.specifications !== undefined) data.specifications = Array.isArray(dto.specifications) ? dto.specifications : [];

    if (dto.metalId !== undefined || dto.metalIds !== undefined) {
      const mId = dto.metalId || (Array.isArray(dto.metalIds) && dto.metalIds.length > 0 ? dto.metalIds[0] : null);
      data.metalId = sanitizeUUID(mId);
    }
    if (dto.priceRuleId !== undefined) {
      data.priceRuleId = sanitizeUUID(dto.priceRuleId);
    }
    if (dto.vendorId !== undefined) {
      data.vendorId = sanitizeUUID(dto.vendorId);
    }

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
