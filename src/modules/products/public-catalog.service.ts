import { Injectable, Optional } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';
import { RedisService } from '../../shared/redis/redis.service';
import { FilterConfigService } from '../settings/filter-config.service';

@Injectable()
export class PublicCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly redis: RedisService,
    @Optional() private readonly filterConfigService?: FilterConfigService,
  ) {}

  mapProduct(product: any) {
    const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 7200;

    const priceBreakdown = this.productsService.calculatePrice(
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

    const safeImages = Array.isArray(product?.images) ? product.images : [];
    const festivalIds = Array.isArray(product?.festivalIds) ? product.festivalIds : [];
    const relationIds = Array.isArray(product?.relationIds) ? product.relationIds : [];
    const collectionIds = Array.isArray(product?.collectionIds) ? product.collectionIds : [];

    const rawAttributes = product?.attributes && typeof product.attributes === 'object' && !Array.isArray(product.attributes)
      ? { ...product.attributes }
      : {};
    const rawSizes = Array.isArray(rawAttributes.sizes)
      ? rawAttributes.sizes
      : (Array.isArray((product as any).sizes) ? (product as any).sizes : []);
    rawAttributes.sizes = rawSizes;

    const isRecent = product.createdAt && (Date.now() - new Date(product.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000);
    const rawTag = rawAttributes.tags || rawAttributes.tag || (product.isFeatured ? 'Bestseller' : (isRecent ? 'New' : ''));

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
      tags: rawTag,
      tag: rawTag,
      weight: Number(product.weightGrams || 0),
      weightGrams: Number(product.weightGrams || 0),
      grossWeight: product.grossWeight ? Number(product.grossWeight) : Number(product.weightGrams || 0),
      netGoldWeight: product.netGoldWeight ? Number(product.netGoldWeight) : Number(product.weightGrams || 0),
      stoneWeight: product.stoneWeight ? Number(product.stoneWeight) : 0,
      purity: product.purity || '22KT',
      wastagePercent: product.wastagePercent ? Number(product.wastagePercent) : 0,
      bisHallmark: product.bisHallmark ?? true,
      stock: product.stockQuantity,
      stockQuantity: product.stockQuantity,
      isActive: product.isActive ?? true,
      isPublished: product.isPublished,
      isFeatured: product.isFeatured,
      isPriceFixed: product.isPriceFixed,
      actualPrice: priceBreakdown.finalPrice,
      discountedPrice: priceBreakdown.finalPrice,
      festivalIds,
      relationIds,
      collectionIds,
      attributes: rawAttributes,
      sizes: rawSizes,
      specifications: product.specifications || [],
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

  async getCategoryMenu(metalParam?: string) {
    const cacheKey = `cache:category_menu:${metalParam || 'all'}`;
    const cachedData = await this.redis.get<any>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

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
        }
      }
    }

    const where: any = { isDeleted: false };
    if (targetMetalId) {
      where.OR = [
        { metalIds: { has: targetMetalId } },
        { products: { some: { metalId: targetMetalId, isDeleted: false, isPublished: true } } },
      ];
    }

    const categories = await this.prisma.category.findMany({
      where,
      include: { subcategories: { where: { isDeleted: false } } },
      orderBy: { name: 'asc' },
    });

    const response = {
      status: 'success',
      data: categories,
    };

    await this.redis.set(cacheKey, response, 120);
    return response;
  }

  async getEssentials(metalParam?: string) {
    const cacheKey = `cache:essentials:${metalParam || 'all'}`;
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
        }
      }
    }

    const rawProducts = await this.prisma.product.findMany({
      where: {
        isDeleted: false,
        isPublished: true,
        approvalStatus: 'APPROVED',
        ...(targetMetalId ? { metalId: targetMetalId } : {}),
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
    await this.redis.set(cacheKey, response, 120).catch(() => null);
    return response;
  }

  async getTrendingProducts(metalParam?: string, limit: number = 4) {
    const cacheKey = `cache:trending:${metalParam || 'all'}:${limit}`;
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
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
      take: Math.max(limit, 12),
    });

    const sorted = [...rawProducts].sort((a: any, b: any) => {
      const aTag = ((a.attributes?.tags || a.attributes?.tag || '') + (a.isFeatured ? ' bestseller' : '')).toLowerCase();
      const bTag = ((b.attributes?.tags || b.attributes?.tag || '') + (b.isFeatured ? ' bestseller' : '')).toLowerCase();
      const aScore = aTag.includes('bestseller') ? 3 : aTag.includes('new') ? 2 : aTag.includes('sale') || a.isFeatured ? 1 : 0;
      const bScore = bTag.includes('bestseller') ? 3 : bTag.includes('new') ? 2 : bTag.includes('sale') || b.isFeatured ? 1 : 0;
      return bScore - aScore;
    });

    const products = sorted.slice(0, limit).map((p) => this.mapProduct(p));
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

  async getFestivals(metalId?: string) {
    const cacheKey = metalId ? `cache:festivals_public_${metalId}` : 'cache:festivals_public';
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    let occasions: any[] = [];
    if (this.filterConfigService) {
      occasions = await this.filterConfigService.getOccasionsList();
    } else {
      const setting = await this.prisma.setting.findUnique({ where: { key: 'gift_store_config' } });
      occasions = (setting?.value as any)?.occasions || [];
    }

    let activeFestivals = (occasions || []).filter((f: any) => f.isActive !== false && f.status !== 'inactive');

    if (metalId) {
      activeFestivals = activeFestivals.filter((f: any) => {
        if (!f.metalIds || !Array.isArray(f.metalIds) || f.metalIds.length === 0) return true;
        return f.metalIds.includes(metalId);
      });
    }

    const festivals = activeFestivals.map((f: any) => {
      const rawImg = typeof f.image === 'string' ? f.image : typeof f.mainImage === 'string' ? f.mainImage : '';
      return {
        _id: f._id || f.id,
        id: f._id || f.id,
        name: f.name,
        description: f.description || '',
        slug: f.slug,
        image: rawImg,
        mainImage: rawImg,
        link: f.link || f.url || (f.slug ? `/collections/${f.slug}` : ''),
        startDate: f.startDate || '',
        endDate: f.endDate || '',
        metalIds: Array.isArray(f.metalIds) ? f.metalIds : [],
        isActive: f.isActive !== undefined ? f.isActive : true,
      };
    });

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

  parsePriceRanges(query: any, configuredPriceFilters?: any[]): { min: number; max: number }[] {
    const ranges: { min: number; max: number }[] = [];

    const defaultPresets: Record<string, { min: number; max: number }> = {
      '1': { min: 0, max: 10000 },
      '2': { min: 10000, max: 25000 },
      '3': { min: 25000, max: 50000 },
      '4': { min: 50000, max: 100000 },
      '5': { min: 100000, max: Infinity },
      'under-10000': { min: 0, max: 10000 },
      '10000-25000': { min: 10000, max: 25000 },
      '25000-50000': { min: 25000, max: 50000 },
      '50000-100000': { min: 50000, max: 100000 },
      'above-100000': { min: 100000, max: Infinity },
    };

    // 1. Check 'price' parameter (checkboxes or range slugs)
    if (query?.price !== undefined && query?.price !== null && query?.price !== '') {
      const rawPriceValues = Array.isArray(query.price)
        ? query.price
        : String(query.price).split(',');

      for (const valRaw of rawPriceValues) {
        const val = String(valRaw).trim().toLowerCase();
        if (!val) continue;

        if (defaultPresets[val]) {
          ranges.push(defaultPresets[val]);
          continue;
        }

        if (configuredPriceFilters && configuredPriceFilters.length > 0) {
          const found = configuredPriceFilters.find(
            (pf: any) =>
              String(pf._id || pf.id).toLowerCase() === val ||
              String(pf.label || '').toLowerCase() === val ||
              `${pf.min}-${pf.max}`.toLowerCase() === val,
          );
          if (found) {
            ranges.push({
              min: Number(found.min || 0),
              max: found.max !== undefined && Number(found.max) > 0 && Number(found.max) < 9999999 ? Number(found.max) : Infinity,
            });
            continue;
          }
        }

        const underMatch = val.match(/^under[-_]?(\d+)$/i);
        if (underMatch) {
          ranges.push({ min: 0, max: Number(underMatch[1]) });
          continue;
        }

        const aboveMatch = val.match(/^above[-_]?(\d+)$/i);
        if (aboveMatch) {
          ranges.push({ min: Number(aboveMatch[1]), max: Infinity });
          continue;
        }

        const betweenMatch = val.match(/^(\d+)[-_](\d+)$/i);
        if (betweenMatch) {
          ranges.push({ min: Number(betweenMatch[1]), max: Number(betweenMatch[2]) });
          continue;
        }
      }
    }

    // 2. If no explicit 'price' ranges resolved, check 'minPrice' and 'maxPrice'
    if (ranges.length === 0 && (query?.minPrice !== undefined || query?.maxPrice !== undefined)) {
      const minVal =
        query.minPrice !== undefined && query.minPrice !== ''
          ? Number(Array.isArray(query.minPrice) ? query.minPrice[0] : query.minPrice)
          : 0;
      const maxVal =
        query.maxPrice !== undefined && query.maxPrice !== ''
          ? Number(Array.isArray(query.maxPrice) ? query.maxPrice[0] : query.maxPrice)
          : Infinity;

      const min = isNaN(minVal) ? 0 : Math.max(0, minVal);
      const max = isNaN(maxVal) ? Infinity : maxVal;

      if (min > 0 || max < Infinity) {
        ranges.push({ min, max });
      }
    }

    return ranges;
  }

  applyFiltersAndSort(products: any[], query: any, priceRanges: { min: number; max: number }[]) {
    let filtered = [...products];

    // 1. Price range filter
    if (priceRanges.length > 0) {
      filtered = filtered.filter((p) => {
        const price = Number(p.calculatedPrice?.finalPrice ?? p.actualPrice ?? p.discountedPrice ?? 0);
        return priceRanges.some(
          (range) => price >= range.min && (range.max === Infinity || price <= range.max),
        );
      });
    }

    // 2. Purity filter
    if (query?.purity) {
      const purities = (Array.isArray(query.purity) ? query.purity : String(query.purity).split(','))
        .map((s: string) => s.trim().toLowerCase())
        .filter(Boolean);
      if (purities.length > 0) {
        filtered = filtered.filter((p) => {
          const prodPurity = String(p.purity || '').toLowerCase();
          const metalName = String(p.metal?.name || '').toLowerCase();
          return purities.some((pur) => prodPurity.includes(pur) || metalName.includes(pur));
        });
      }
    }

    // 3. Category / Subcategory filter
    if (query?.category) {
      const categories = (Array.isArray(query.category) ? query.category : String(query.category).split(','))
        .map((s: string) => s.trim().toLowerCase())
        .filter(Boolean);
      if (categories.length > 0) {
        filtered = filtered.filter((p) => {
          const catSlug = String(p.category?.slug || '').toLowerCase();
          const catId = String(p.categoryId || '').toLowerCase();
          const catName = String(p.category?.name || '').toLowerCase();
          const subSlug = String(p.subcategory?.slug || '').toLowerCase();
          const subId = String(p.subcategoryId || '').toLowerCase();
          return categories.some((c) => c === catSlug || c === catId || c === catName || c === subSlug || c === subId);
        });
      }
    }

    if (query?.subcategoryId) {
      const subcategoryIds = (Array.isArray(query.subcategoryId) ? query.subcategoryId : String(query.subcategoryId).split(','))
        .map((s: string) => s.trim().toLowerCase())
        .filter(Boolean);
      if (subcategoryIds.length > 0) {
        filtered = filtered.filter((p) => {
          const subId = String(p.subcategoryId || '').toLowerCase();
          const subSlug = String(p.subcategory?.slug || '').toLowerCase();
          return subcategoryIds.some((s) => s === subId || s === subSlug);
        });
      }
    }

    // 4. In Stock filter
    if (query?.inStock === 'true' || query?.inStock === true) {
      filtered = filtered.filter((p) => Number(p.stockQuantity || p.stock || 0) > 0);
    }

    // 5. Gender filter
    if (query?.gender) {
      const genders = (Array.isArray(query.gender) ? query.gender : String(query.gender).split(','))
        .map((s: string) => s.trim().toLowerCase())
        .filter(Boolean);
      if (genders.length > 0) {
        filtered = filtered.filter((p) => {
          const attrGender = String(p.attributes?.gender || p.attributes?.Gender || '').toLowerCase();
          return genders.some((g) => attrGender.includes(g));
        });
      }
    }

    // 6. Tag filter (e.g. tag=new or tag=bestseller)
    if (query?.tag) {
      const targetTag = String(query.tag).trim().toLowerCase();
      filtered = filtered.filter((p) => {
        const rawValues = [
          p.tag,
          p.tags,
          p.attributes?.tag,
          p.attributes?.tags,
        ].filter(Boolean);

        return rawValues.some((val) => {
          if (Array.isArray(val)) {
            return val.some((v) => {
              const str = String(v).trim().toLowerCase();
              return str === targetTag || str.includes(targetTag);
            });
          }
          const str = String(val).trim().toLowerCase();
          return str === targetTag || str.includes(targetTag);
        });
      });
    }

    // 7. Search filter
    if (query?.search && String(query.search).trim()) {
      const q = String(query.search).trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          String(p.title || '').toLowerCase().includes(q) ||
          String(p.name || '').toLowerCase().includes(q) ||
          String(p.sku || '').toLowerCase().includes(q) ||
          String(p.description || '').toLowerCase().includes(q),
      );
    }

    // 7. Sorting
    const sort = String(query?.sortBy || query?.sort || '').toLowerCase();
    if (sort === 'price_asc' || sort === 'price_low_to_high' || sort === 'low_to_high') {
      filtered.sort((a, b) => {
        const priceA = Number(a.calculatedPrice?.finalPrice ?? a.actualPrice ?? 0);
        const priceB = Number(b.calculatedPrice?.finalPrice ?? b.actualPrice ?? 0);
        return priceA - priceB;
      });
    } else if (sort === 'price_desc' || sort === 'price_high_to_low' || sort === 'high_to_low') {
      filtered.sort((a, b) => {
        const priceA = Number(a.calculatedPrice?.finalPrice ?? a.actualPrice ?? 0);
        const priceB = Number(b.calculatedPrice?.finalPrice ?? b.actualPrice ?? 0);
        return priceB - priceA;
      });
    } else if (sort === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    } else {
      // Default newest
      filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    return filtered;
  }

  async getProductsByCategorySlug(
    slug: string,
    pageOrQuery: any = 1,
    limitParam: number = 20,
    metalIdParam?: string,
  ) {
    let page = 1;
    let limit = 20;
    let metalId: string | undefined = undefined;
    let queryObj: any = {};

    if (typeof pageOrQuery === 'object' && pageOrQuery !== null) {
      queryObj = pageOrQuery;
      page = Math.max(1, parseInt(queryObj.page || '1', 10));
      limit = Math.min(100, Math.max(1, parseInt(queryObj.limit || '20', 10)));
      metalId = queryObj.metalId;
    } else {
      page = Math.max(1, typeof pageOrQuery === 'number' ? pageOrQuery : parseInt(pageOrQuery || '1', 10));
      limit = Math.min(100, Math.max(1, typeof limitParam === 'number' ? limitParam : parseInt(limitParam as any || '20', 10)));
      metalId = metalIdParam;
    }

    const priceRanges = this.parsePriceRanges(queryObj);
    const filterKeyStr = JSON.stringify({ slug, page, limit, metalId, queryObj });
    const filterHash = crypto.createHash('md5').update(filterKeyStr).digest('hex');
    const cacheKey = `cache:category_slug:${slug}:${filterHash}`;

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

      const rawProducts = await this.prisma.product.findMany({
        where: condition,
        include: { category: true, subcategory: true, metal: true, priceRule: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      });

      const mappedProducts = rawProducts.map((product) => this.mapProduct(product));
      const filteredProducts = this.applyFiltersAndSort(mappedProducts, queryObj, priceRanges);
      const total = filteredProducts.length;
      const paginatedProducts = filteredProducts.slice(skip, skip + limit);

      const response = {
        status: 'success',
        data: {
          products: paginatedProducts,
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

      const rawProducts = await this.prisma.product.findMany({
        where: whereCondition,
        include: { category: true, subcategory: true, metal: true, priceRule: true },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      });

      const mappedProducts = rawProducts.map((product) => this.mapProduct(product));
      const filteredProducts = this.applyFiltersAndSort(mappedProducts, queryObj, priceRanges);
      const total = filteredProducts.length;
      const paginatedProducts = filteredProducts.slice(skip, skip + limit);

      const response = {
        status: 'success',
        data: {
          products: paginatedProducts,
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

      const rawProducts = await this.prisma.product.findMany({
        where: condition,
        include: { category: true, subcategory: true, metal: true, priceRule: true },
        orderBy: { createdAt: 'desc' },
      });

      const mappedProducts = rawProducts.map((product) => this.mapProduct(product));
      const filteredProducts = this.applyFiltersAndSort(mappedProducts, queryObj, priceRanges);
      const total = filteredProducts.length;
      const paginatedProducts = filteredProducts.slice(skip, skip + limit);

      const response = {
        status: 'success',
        data: {
          products: paginatedProducts,
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

      const rawProducts = await this.prisma.product.findMany({
        where: condition,
        include: { category: true, subcategory: true, metal: true, priceRule: true },
        orderBy: { createdAt: 'desc' },
      });

      const mappedProducts = rawProducts.map((product) => this.mapProduct(product));
      const filteredProducts = this.applyFiltersAndSort(mappedProducts, queryObj, priceRanges);
      const total = filteredProducts.length;
      const paginatedProducts = filteredProducts.slice(skip, skip + limit);

      const response = {
        status: 'success',
        data: {
          products: paginatedProducts,
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

    // 4. Try Multi-Taxonomy Match (Festivals, Relations, Collections, Occasions)
    const multiTaxonomyCondition = {
      isDeleted: false,
      isPublished: true,
      approvalStatus: 'APPROVED' as const,
      OR: [
        { festivalIds: { has: slug } },
        { relationIds: { has: slug } },
        { collectionIds: { has: slug } },
      ],
      ...metalCondition,
    };

    const taxProducts = await this.prisma.product.findMany({
      where: multiTaxonomyCondition,
      include: { category: true, subcategory: true, metal: true, priceRule: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    if (taxProducts.length > 0) {
      const mappedProducts = taxProducts.map((product) => this.mapProduct(product));
      const filteredProducts = this.applyFiltersAndSort(mappedProducts, queryObj, priceRanges);
      const total = filteredProducts.length;
      const paginatedProducts = filteredProducts.slice(skip, skip + limit);

      const response = {
        status: 'success',
        data: {
          products: paginatedProducts,
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
