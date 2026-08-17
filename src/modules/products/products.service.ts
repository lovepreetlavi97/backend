import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import slugify from 'slugify';
import * as crypto from 'crypto';

export interface CalculatedProductPrice {
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
  constructor(private readonly prisma: PrismaService) {}

  calculatePrice(
    weightGrams: number,
    ratePerGram: number,
    makingChargeGram: number,
    gstPercentage: number = 3.0,
    discountPercent: number = 0.0,
  ): CalculatedProductPrice {
    const baseMetalPrice = weightGrams * ratePerGram;
    const totalMakingCharge = weightGrams * makingChargeGram;
    const rawTotal = baseMetalPrice + totalMakingCharge;

    const gstAmount = (rawTotal * gstPercentage) / 100;
    const discountAmount = (rawTotal * discountPercent) / 100;
    const finalPrice = Math.round((rawTotal + gstAmount - discountAmount) * 100) / 100;

    return {
      metalRatePerGram: ratePerGram,
      weightGrams,
      baseMetalPrice,
      makingChargeGram,
      totalMakingCharge,
      priceBeforeTax: rawTotal,
      gstAmount,
      discountAmount,
      finalPrice,
    };
  }

  async findBySlug(slug: string) {
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

    const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 6500;
    const makingCharge = product.priceRule ? Number(product.priceRule.makingChargeGram) : 450;
    const gstPercent = product.priceRule ? Number(product.priceRule.gstPercentage) : 3.0;
    const discountPercent = product.priceRule ? Number(product.priceRule.discountPercent) : 0.0;

    const priceBreakdown = this.calculatePrice(
      Number(product.weightGrams),
      ratePerGram,
      makingCharge,
      gstPercent,
      discountPercent,
    );

    return {
      ...product,
      calculatedPrice: priceBreakdown,
    };
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    collectionId?: string;
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    const mappedProducts = products.map((product) => {
      const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 6500;
      const makingCharge = product.priceRule ? Number(product.priceRule.makingChargeGram) : 450;
      const gstPercent = product.priceRule ? Number(product.priceRule.gstPercentage) : 3.0;
      const discountPercent = product.priceRule ? Number(product.priceRule.discountPercent) : 0.0;

      const priceBreakdown = this.calculatePrice(
        Number(product.weightGrams),
        ratePerGram,
        makingCharge,
        gstPercent,
        discountPercent,
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

    const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 6500;
    const makingCharge = product.priceRule ? Number(product.priceRule.makingChargeGram) : 450;
    const gstPercent = product.priceRule ? Number(product.priceRule.gstPercentage) : 3.0;
    const discountPercent = product.priceRule ? Number(product.priceRule.discountPercent) : 0.0;

    const priceBreakdown = this.calculatePrice(
      Number(product.weightGrams),
      ratePerGram,
      makingCharge,
      gstPercent,
      discountPercent,
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

    return this.prisma.product.create({
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
        isFeatured: dto.isFeatured === 'true' || dto.isFeatured === true,
        isPublished: dto.isPublished === 'true' || dto.isPublished === true,
      },
    });
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
    if (dto.isFeatured !== undefined) data.isFeatured = dto.isFeatured === 'true' || dto.isFeatured === true;
    if (dto.isPublished !== undefined) data.isPublished = dto.isPublished === 'true' || dto.isPublished === true;

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.isDeleted) {
      throw new NotFoundException(`Product with ID '${id}' not found.`);
    }

    return this.prisma.product.update({
      where: { id },
      data: { isDeleted: true, isPublished: false },
    });
  }

  async toggleBlock(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || product.isDeleted) {
      throw new NotFoundException(`Product with ID '${id}' not found.`);
    }

    return this.prisma.product.update({
      where: { id },
      data: { isPublished: !product.isPublished },
    });
  }
}
