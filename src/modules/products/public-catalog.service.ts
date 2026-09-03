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
    const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 7200;

    const priceBreakdown = this.productsService.calculatePrice(
      Number(product.weightGrams || 0),
      ratePerGram,
      product.isPriceFixed,
      product.actualPrice ? Number(product.actualPrice) : null,
      product.discountedPrice ? Number(product.discountedPrice) : null,
    );

    const safeImages = Array.isArray(product?.images) ? product.images : [];

    return {
      _id: product.id,
      name: product.title,
      slug: product.slug,
      description: product.description,
      mainImage: safeImages[0] || '',
      images: safeImages,
      weightGrams: product.weightGrams,
      stock: product.stockQuantity,
      isActive: product.isActive,
      isPublished: product.isPublished,
      isPriceFixed: product.isPriceFixed,
      actualPrice: priceBreakdown.finalPrice,
      discountedPrice: priceBreakdown.finalPrice,
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
    const cacheKey = 'cache:essentials';
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const rawProducts = await this.prisma.product.findMany({
      where: { isDeleted: false, isPublished: true, approvalStatus: 'APPROVED' },
      include: { category: true, subcategory: true, metal: true, priceRule: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 8,
    });
    const products = rawProducts.map((p) => this.mapProduct(p));
    const response = {
      status: 'success',
      data: { products },
    };
    await this.redis.set(cacheKey, response, 300).catch(() => null);
    return response;
  }

  async getTrendingProducts(metalParam?: string) {
    const cacheKey = `cache:trending:${metalParam || 'all'}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    let targetMetalId: string | undefined = undefined;

    if (metalParam && metalParam.trim() !== '' && metalParam.toLowerCase() !== 'all') {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(metalParam);
      if (isUuid) {
        targetMetalId = metalParam;
      } else {
        const foundMetal = await this.prisma.metal.findFirst({
          where: {
            OR: [
              { slug: { equals: metalParam.toLowerCase() } },
              { name: { equals: metalParam, mode: 'insensitive' } },
            ],
          },
        });
        if (foundMetal) {
          targetMetalId = foundMetal.id;
        } else {
          return {
            status: 'success',
            data: { products: [] },
          };
        }
      }
    }

    const rawProducts = await this.prisma.product.findMany({
      where: {
        isDeleted: false,
        isPublished: true,
        approvalStatus: 'APPROVED',
        metalId: targetMetalId || undefined,
      },
      include: { category: true, subcategory: true, metal: true, priceRule: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 8,
    });
    const products = rawProducts.map((p) => this.mapProduct(p));
    const response = {
      status: 'success',
      data: { products },
    };
    await this.redis.set(cacheKey, response, 300).catch(() => null);
    return response;
  }

  async getCuratedCollections() {
    const cacheKey = 'cache:curated_collections';
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

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
    const response = {
      status: 'success',
      data: { curatedCollections },
    };
    await this.redis.set(cacheKey, response, 300).catch(() => null);
    return response;
  }

  async getFestivals() {
    const cacheKey = 'cache:festivals_public';
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

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
    const response = {
      status: 'success',
      data: { festivals },
    };
    await this.redis.set(cacheKey, response, 300).catch(() => null);
    return response;
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
    const cacheKey = 'cache:user_categories';
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const categories = await this.prisma.category.findMany({
      where: { isDeleted: false },
      include: { subcategories: { where: { isDeleted: false } } },
    });
    const response = {
      status: 'success',
      data: { categories },
    };
    await this.redis.set(cacheKey, response, 300).catch(() => null);
    return response;
  }

  async getRelatedProducts(idsParam?: string) {
    const ids = idsParam
      ? idsParam
          .split(',')
          .map((id) => id.trim())
          .filter((id) => id.length > 0)
      : [];

    let categoryIds: string[] = [];
    let subcategoryIds: string[] = [];

    if (ids.length > 0) {
      const sourceProducts = await this.prisma.product.findMany({
        where: { id: { in: ids }, isDeleted: false },
        select: { categoryId: true, subcategoryId: true },
      });

      categoryIds = sourceProducts.map((p) => p.categoryId).filter((id): id is string => !!id);
      subcategoryIds = sourceProducts.map((p) => p.subcategoryId).filter((id): id is string => !!id);
    }

    const rawProducts = await this.prisma.product.findMany({
      where: {
        isDeleted: false,
        isPublished: true,
        approvalStatus: 'APPROVED',
        ...(ids.length > 0 ? { id: { notIn: ids } } : {}),
        ...(categoryIds.length > 0 || subcategoryIds.length > 0
          ? {
              OR: [
                ...(categoryIds.length > 0 ? [{ categoryId: { in: categoryIds } }] : []),
                ...(subcategoryIds.length > 0 ? [{ subcategoryId: { in: subcategoryIds } }] : []),
              ],
            }
          : {}),
      },
      include: { category: true, subcategory: true, metal: true, priceRule: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    let finalProducts = rawProducts;
    if (finalProducts.length === 0) {
      finalProducts = await this.prisma.product.findMany({
        where: { isDeleted: false, isPublished: true, approvalStatus: 'APPROVED' },
        include: { category: true, subcategory: true, metal: true, priceRule: true },
        orderBy: { createdAt: 'desc' },
        take: 8,
      });
    }

    const products = finalProducts.map((p) => this.mapProduct(p));

    return {
      status: 'success',
      data: {
        products,
      },
    };
  }

  async getProductsByCategorySlug(slug: string, page: number = 1, limit: number = 20, metalId?: string) {
    const cacheKey = `cache:category_slug:${slug}:${page}:${limit}:${metalId || 'all'}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const skip = (page - 1) * limit;

    // Build optional metal filter condition
    let metalCondition: any = {};
    if (metalId && metalId !== 'all') {
      metalCondition = {
        OR: [
          { metalId: metalId },
          { metal: { slug: { equals: metalId, mode: 'insensitive' } } },
          { metal: { name: { contains: metalId, mode: 'insensitive' } } },
        ],
      };
    }

    // 1. Try direct Metal match (e.g. /collections/22k-gold, /collections/gold, /collections/silver)
    const metalRecord = await this.prisma.metal.findFirst({
      where: {
        OR: [
          { slug: { equals: slug, mode: 'insensitive' } },
          { name: { equals: slug, mode: 'insensitive' } },
        ],
        isActive: true,
      },
    });

    if (metalRecord) {
      const condition = {
        metalId: metalRecord.id,
        isDeleted: false,
        isPublished: true,
        approvalStatus: 'APPROVED' as const,
      };

      const [rawProducts, total] = await Promise.all([
        this.prisma.product.findMany({
          where: condition,
          include: { category: true, subcategory: true, metal: true, priceRule: true },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip,
          take: limit,
        }),
        this.prisma.product.count({
          where: condition,
        }),
      ]);

      const products = rawProducts.map((product) => this.mapProduct(product));

      const response = {
        status: 'success',
        data: {
          products,
          metal: metalRecord,
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
      await this.redis.set(cacheKey, response, 120).catch(() => null);
      return response;
    }

    if (slug === 'all') {
      const whereCondition = {
        isDeleted: false,
        isPublished: true,
        approvalStatus: 'APPROVED' as const,
        ...metalCondition,
      };

      const [rawProducts, total] = await Promise.all([
        this.prisma.product.findMany({
          where: whereCondition,
          include: { category: true, subcategory: true, metal: true, priceRule: true },
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          skip,
          take: limit,
        }),
        this.prisma.product.count({
          where: whereCondition,
        }),
      ]);

      const products = rawProducts.map((product) => this.mapProduct(product));

      const response = {
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
      await this.redis.set(cacheKey, response, 120).catch(() => null);
      return response;
    }

    // 2. Try category
    const category = await this.prisma.category.findFirst({
      where: {
        OR: [
          { slug: { equals: slug, mode: 'insensitive' } },
          { name: { equals: slug, mode: 'insensitive' } },
        ],
        isDeleted: false,
      },
      include: { subcategories: { where: { isDeleted: false } } },
    });

    if (category) {
      const subcategoryIds = category.subcategories.map((s) => s.id);
      const condition = {
        OR: [
          { categoryId: category.id },
          ...(subcategoryIds.length > 0 ? [{ subcategoryId: { in: subcategoryIds } }] : []),
        ],
        isDeleted: false,
        isPublished: true,
        approvalStatus: 'APPROVED' as const,
        ...metalCondition,
      };

      const [rawProducts, total] = await Promise.all([
        this.prisma.product.findMany({
          where: condition,
          include: { category: true, subcategory: true, metal: true, priceRule: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.product.count({
          where: condition,
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

    // 3. Try subcategory
    const subcategory = await this.prisma.subCategory.findFirst({
      where: {
        OR: [
          { slug: { equals: slug, mode: 'insensitive' } },
          { name: { equals: slug, mode: 'insensitive' } },
        ],
        isDeleted: false,
      },
    });

    if (subcategory) {
      const condition = {
        subcategoryId: subcategory.id,
        isDeleted: false,
        isPublished: true,
        approvalStatus: 'APPROVED' as const,
        ...metalCondition,
      };

      const [rawProducts, total] = await Promise.all([
        this.prisma.product.findMany({
          where: condition,
          include: { category: true, subcategory: true, metal: true, priceRule: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.product.count({
          where: condition,
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
