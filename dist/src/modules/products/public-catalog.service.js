"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicCatalogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const products_service_1 = require("./products.service");
const redis_service_1 = require("../../shared/redis/redis.service");
let PublicCatalogService = class PublicCatalogService {
    constructor(prisma, productsService, redis) {
        this.prisma = prisma;
        this.productsService = productsService;
        this.redis = redis;
    }
    mapProduct(product) {
        const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 6500;
        const makingCharge = product.priceRule ? Number(product.priceRule.makingChargeGram) : 450;
        const gstPercent = product.priceRule ? Number(product.priceRule.gstPercentage) : 3.0;
        const discountPercent = product.priceRule ? Number(product.priceRule.discountPercent) : 0.0;
        const priceBreakdown = this.productsService.calculatePrice(Number(product.weightGrams || 0), ratePerGram, makingCharge, gstPercent, discountPercent);
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
    async getFeaturedSubcategories(defaultImage, defaultDesc) {
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
        const cachedData = await this.redis.get(cacheKey);
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
        const cachedData = await this.redis.get(cacheKey);
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
    async getTrendingProducts(metalParam) {
        let targetMetalId = undefined;
        if (metalParam && metalParam.trim() !== '' && metalParam.toLowerCase() !== 'all') {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(metalParam);
            if (isUuid) {
                targetMetalId = metalParam;
            }
            else {
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
                else {
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
    async getHomeSearch(queryStr) {
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
    async getProductsByCategorySlug(slug, page, limit) {
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
};
exports.PublicCatalogService = PublicCatalogService;
exports.PublicCatalogService = PublicCatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        products_service_1.ProductsService,
        redis_service_1.RedisService])
], PublicCatalogService);
//# sourceMappingURL=public-catalog.service.js.map