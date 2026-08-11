import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';
import { RedisService } from '../../shared/redis/redis.service';

@Injectable()
export class PublicCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly redis: RedisService,
  ) {}

  mapProduct(product: any) {
    const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 6500;
    const makingCharge = product.priceRule ? Number(product.priceRule.makingChargeGram) : 450;
    const gstPercent = product.priceRule ? Number(product.priceRule.gstPercentage) : 3.0;
    const discountPercent = product.priceRule ? Number(product.priceRule.discountPercent) : 0.0;

    const priceBreakdown = this.productsService.calculatePrice(
      Number(product.weightGrams),
      ratePerGram,
      makingCharge,
      gstPercent,
      discountPercent,
    );

    return {
      _id: product.id,
      name: product.title,
      slug: product.slug,
      description: product.description,
      mainImage: product.images[0] || '',
      images: product.images,
      weightGrams: product.weightGrams,
      stock: product.stockQuantity,
      isActive: product.isActive,
      isPublished: product.isPublished,
      metalId: product.metalId,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      priceRuleId: product.priceRuleId,
      calculatedPrice: priceBreakdown,
      metal: product.metal,
      category: product.category,
      subcategory: product.subcategory,
      priceRule: product.priceRule,
    };
  }

  async getFeaturedSubcategories(defaultImage: string, defaultDesc: string) {
    const subcategories = await this.prisma.subCategory.findMany({
      where: { isDeleted: false },
      take: 5,
    });
    return subcategories.map((sub) => ({
      _id: sub.id,
      name: sub.name,
      slug: sub.slug,
      image: sub.image || defaultImage,
      mainImage: sub.image || defaultImage,
      description: sub.description || defaultDesc,
    }));
  }

  async getHomepage() {
    const cacheKey = 'cache:homepage';
    const cachedData = await this.redis.get<any>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const banners = await this.prisma.banner.findMany({
      where: { isDeleted: false, status: 'active' },
      orderBy: { position: 'asc' },
    });

    const categories = await this.prisma.category.findMany({
      where: { isDeleted: false },
      include: { subcategories: { where: { isDeleted: false } } },
    });

    const rawProducts = await this.prisma.product.findMany({
      where: { isDeleted: false, isPublished: true, approvalStatus: 'APPROVED' },
      include: { category: true, subcategory: true, metal: true, priceRule: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    const products = rawProducts.map((p) => this.mapProduct(p));

    const response = {
      status: 'success',
      data: {
        banners,
        categories,
        featuredProducts: products,
        newArrivals: products,
      },
    };

    await this.redis.set(cacheKey, response, 60);
    return response;
  }

  async getCategoryMenu() {
    const cacheKey = 'cache:category_menu';
    const cachedData = await this.redis.get<any>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const categories = await this.prisma.category.findMany({
      where: { isDeleted: false },
      include: { subcategories: { where: { isDeleted: false } } },
      orderBy: { name: 'asc' },
    });

    const response = {
      status: 'success',
      data: categories,
    };

    await this.redis.set(cacheKey, response, 300);
    return response;
  }

  async getEssentials() {
    const rawProducts = await this.prisma.product.findMany({
      where: { isDeleted: false, isPublished: true, approvalStatus: 'APPROVED' },
      include: { category: true, subcategory: true, metal: true, priceRule: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    const products = rawProducts.map((p) => this.mapProduct(p));
    return {
      status: 'success',
      data: { products },
    };
  }

  async getTrendingProducts(metalId?: string) {
    const rawProducts = await this.prisma.product.findMany({
      where: {
        isDeleted: false,
        isPublished: true,
        approvalStatus: 'APPROVED',
        metalId: metalId || undefined,
      },
      include: { category: true, subcategory: true, metal: true, priceRule: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    const products = rawProducts.map((p) => this.mapProduct(p));
    return {
      status: 'success',
      data: { products },
    };
  }

  async getCuratedCollections() {
    const subcategories = await this.prisma.subCategory.findMany({
      where: { isDeleted: false },
      take: 5,
    });
    const curatedCollections = subcategories.map((sub) => ({
      _id: sub.id,
      name: sub.name,
      slug: sub.slug,
      image: sub.image || '/images/default-collection.jpg',
      description: sub.description || 'Exclusive curated collection',
    }));
    return {
      status: 'success',
      data: { curatedCollections },
    };
  }

  async getFestivals() {
    const subcategories = await this.prisma.subCategory.findMany({
      where: { isDeleted: false },
      take: 5,
    });
    const festivals = subcategories.map((sub) => ({
      _id: sub.id,
      name: sub.name,
      slug: sub.slug,
      mainImage: sub.image || '/images/default-festival.jpg',
      description: sub.description || 'Celebrate seasons with luxury',
    }));
    return {
      status: 'success',
      data: { festivals },
    };
  }

  async getHomeSearch(queryStr?: string) {
    const subcategories = await this.prisma.subCategory.findMany({
      where: {
        isDeleted: false,
        name: queryStr ? { contains: queryStr, mode: 'insensitive' } : undefined,
      },
      take: 5,
    });
    const rawProducts = await this.prisma.product.findMany({
      where: {
        isDeleted: false,
        isPublished: true,
        approvalStatus: 'APPROVED',
        OR: queryStr
          ? [
              { title: { contains: queryStr, mode: 'insensitive' } },
              { description: { contains: queryStr, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: { category: true, subcategory: true, metal: true, priceRule: true },
      take: 10,
    });
    const products = rawProducts.map((p) => this.mapProduct(p));
    return {
      status: 'success',
      data: {
        subcategories,
        products,
      },
    };
  }

  async getUserCategories() {
    const categories = await this.prisma.category.findMany({
      where: { isDeleted: false },
      include: { subcategories: { where: { isDeleted: false } } },
    });
    return {
      status: 'success',
      data: { categories },
    };
  }

  async getProductsByCategorySlug(slug: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    if (slug === 'all') {
      const [rawProducts, total] = await Promise.all([
        this.prisma.product.findMany({
          where: { isDeleted: false, isPublished: true, approvalStatus: 'APPROVED' },
          include: { category: true, subcategory: true, metal: true, priceRule: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.product.count({
          where: { isDeleted: false, isPublished: true, approvalStatus: 'APPROVED' },
        }),
      ]);

      const products = rawProducts.map((product) => this.mapProduct(product));

      return {
        status: 'success',
        data: {
          products,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total,
          },
          hasMore: page * limit < total,
        },
      };
    }

    // 1. Try category
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (category) {
      const [rawProducts, total] = await Promise.all([
        this.prisma.product.findMany({
          where: { categoryId: category.id, isDeleted: false, isPublished: true, approvalStatus: 'APPROVED' },
          include: { category: true, subcategory: true, metal: true, priceRule: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.product.count({
          where: { categoryId: category.id, isDeleted: false, isPublished: true, approvalStatus: 'APPROVED' },
        }),
      ]);

      const products = rawProducts.map((product) => this.mapProduct(product));

      return {
        status: 'success',
        data: {
          products,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total,
          },
          hasMore: page * limit < total,
        },
      };
    }

    // 2. Try subcategory
    const subcategory = await this.prisma.subCategory.findUnique({
      where: { slug },
    });

    if (subcategory) {
      const [rawProducts, total] = await Promise.all([
        this.prisma.product.findMany({
          where: { subcategoryId: subcategory.id, isDeleted: false, isPublished: true, approvalStatus: 'APPROVED' },
          include: { category: true, subcategory: true, metal: true, priceRule: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.product.count({
          where: { subcategoryId: subcategory.id, isDeleted: false, isPublished: true, approvalStatus: 'APPROVED' },
        }),
      ]);

      const products = rawProducts.map((product) => this.mapProduct(product));

      return {
        status: 'success',
        data: {
          products,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: page * limit < total,
          },
          hasMore: page * limit < total,
        },
      };
    }

    return {
      status: 'success',
      data: {
        products: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
        hasMore: false,
      },
    };
  }
}
