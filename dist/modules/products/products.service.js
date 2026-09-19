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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../../shared/redis/redis.service");
const slugify_1 = require("slugify");
const crypto = require("crypto");
const isValidUUID = (str) => {
    return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
};
const sanitizeUUID = (val) => {
    if (!val)
        return null;
    const str = typeof val === 'object' ? (val._id || val.id || '') : String(val);
    return isValidUUID(str) ? str.trim() : null;
};
const parseSafeJson = (val) => {
    if (val === undefined || val === null || val === '')
        return undefined;
    if (typeof val === 'string') {
        try {
            return JSON.parse(val);
        }
        catch {
            return val;
        }
    }
    return val;
};
const parseSafeArray = (val) => {
    if (val === undefined || val === null || val === '')
        return [];
    if (Array.isArray(val))
        return val;
    if (typeof val === 'string') {
        try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed))
                return parsed;
        }
        catch { }
        return [val];
    }
    return [val];
};
let ProductsService = class ProductsService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
    }
    calculatePrice(weightGrams, ratePerGram, isPriceFixed = false, actualPrice, discountedPrice, grossWeight, netGoldWeight, stoneWeight, wastagePercentVal, priceRule) {
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
        const baseMetal = Math.ceil(weight * rate);
        const makingPerGram = priceRule ? Number(priceRule.makingChargeGram || 0) : 0;
        const totalMaking = Math.ceil(gross * makingPerGram);
        const wastagePct = wastagePercentVal ? Number(wastagePercentVal) : 0;
        const wastageAmt = Math.ceil(baseMetal * (wastagePct / 100));
        const hallmarking = 0;
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
    mapProductRecord(product) {
        const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 7200;
        const priceBreakdown = this.calculatePrice(Number(product.weightGrams || 0), ratePerGram, product.isPriceFixed, product.actualPrice ? Number(product.actualPrice) : null, product.discountedPrice ? Number(product.discountedPrice) : null, product.grossWeight ? Number(product.grossWeight) : null, product.netGoldWeight ? Number(product.netGoldWeight) : null, product.stoneWeight ? Number(product.stoneWeight) : null, product.wastagePercent ? Number(product.wastagePercent) : null, product.priceRule);
        const safeImages = Array.isArray(product.images) ? product.images : [];
        const festivalIds = Array.isArray(product.festivalIds) ? product.festivalIds : [];
        const relationIds = Array.isArray(product.relationIds) ? product.relationIds : [];
        const collectionIds = Array.isArray(product.collectionIds) ? product.collectionIds : [];
        const rawAttributes = product.attributes && typeof product.attributes === 'object' && !Array.isArray(product.attributes)
            ? { ...product.attributes }
            : {};
        const rawSizes = Array.isArray(rawAttributes.sizes)
            ? rawAttributes.sizes
            : (Array.isArray(product.sizes) ? product.sizes : []);
        rawAttributes.sizes = rawSizes;
        const rawShortDesc = product.shortDescription || rawAttributes.shortDescription || rawAttributes.shortDesc || '';
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
            shortDescription: rawShortDesc,
            image: safeImages[0] || '',
            mainImage: safeImages[0] || '',
            images: safeImages,
            tags: rawTag,
            tag: rawTag,
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
            attributes: rawAttributes,
            sizes: rawSizes,
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
    async findBySlug(slug) {
        const cacheKey = `cache:product:${slug}`;
        const cached = await this.redis.get(cacheKey);
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
            throw new common_1.NotFoundException(`Product with slug '${slug}' not found.`);
        }
        const response = this.mapProductRecord(product);
        await this.redis.set(cacheKey, response, 300).catch(() => null);
        return response;
    }
    async invalidateProductCache(slug) {
        if (slug) {
            await this.redis.del(`cache:product:${slug}`).catch(() => null);
        }
        await this.redis.delPattern('cache:*').catch(() => null);
    }
    async findAll(params) {
        const page = Math.max(1, Number(params.page || 1));
        const limit = Math.max(1, Number(params.limit || 10));
        const skip = (page - 1) * limit;
        const where = {
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
        const rawProducts = await this.prisma.product.findMany({
            where,
            include: {
                category: true,
                subcategory: true,
                metal: true,
                priceRule: true,
            },
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        });
        let mappedProducts = rawProducts.map((product) => this.mapProductRecord(product));
        const minP = params.minPrice !== undefined && params.minPrice !== '' ? Number(params.minPrice) : null;
        const maxP = params.maxPrice !== undefined && params.maxPrice !== '' ? Number(params.maxPrice) : null;
        if (minP !== null || maxP !== null) {
            mappedProducts = mappedProducts.filter((p) => {
                const price = Number(p.calculatedPrice?.finalPrice ?? p.actualPrice ?? p.discountedPrice ?? 0);
                if (minP !== null && !isNaN(minP) && price < minP)
                    return false;
                if (maxP !== null && !isNaN(maxP) && price > maxP)
                    return false;
                return true;
            });
        }
        if (params.inStock === true || params.inStock === 'true') {
            mappedProducts = mappedProducts.filter((p) => Number(p.stockQuantity || 0) > 0);
        }
        const total = mappedProducts.length;
        const paginatedProducts = mappedProducts.slice(skip, skip + limit);
        return {
            status: 'success',
            data: {
                products: paginatedProducts,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                },
            },
        };
    }
    async findById(id) {
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
            throw new common_1.NotFoundException(`Product with ID '${id}' not found.`);
        }
        return this.mapProductRecord(product);
    }
    async create(dto) {
        const title = dto.title || dto.name || 'Untitled Product';
        const slug = (0, slugify_1.default)(title, { lower: true, strict: true }) + '-' + crypto.randomBytes(3).toString('hex');
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
        const festivalIds = parseSafeArray(dto.festivalIds || dto.festivals)
            .map((item) => typeof item === 'object' ? (item._id || item.id) : item)
            .filter(Boolean);
        const relationIds = parseSafeArray(dto.relationIds || dto.relations)
            .map((item) => typeof item === 'object' ? (item._id || item.id) : item)
            .filter(Boolean);
        const collectionIds = parseSafeArray(dto.collectionIds || dto.collections)
            .map((item) => typeof item === 'object' ? (item._id || item.id) : item)
            .filter(Boolean);
        const parsedAttributes = parseSafeJson(dto.attributes) || {};
        const attributes = typeof parsedAttributes === 'object' && !Array.isArray(parsedAttributes)
            ? { ...parsedAttributes }
            : {};
        const rawSizes = dto.sizes !== undefined ? parseSafeArray(dto.sizes) : parseSafeArray(attributes.sizes);
        if (rawSizes.length > 0) {
            attributes.sizes = rawSizes;
        }
        if (dto.tags) {
            attributes.tags = dto.tags;
            attributes.tag = dto.tags;
        }
        if (dto.shortDescription) {
            attributes.shortDescription = dto.shortDescription;
        }
        const specifications = parseSafeArray(parseSafeJson(dto.specifications) || dto.specifications);
        let imagesList = [];
        if (Array.isArray(dto.images)) {
            imagesList = dto.images.filter((img) => typeof img === 'string' && img.trim().length > 0);
        }
        else if (typeof dto.images === 'string' && dto.images.trim().length > 0) {
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
        const isBestseller = dto.tags && String(dto.tags).toLowerCase() === 'bestseller';
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
                isFeatured: dto.isFeatured === 'true' || dto.isFeatured === true || isBestseller,
                isPublished: dto.isPublished !== undefined
                    ? (dto.isPublished === 'true' || dto.isPublished === true)
                    : (dto.tags !== 'Draft'),
            },
        });
        await this.invalidateProductCache(created.slug);
        return created;
    }
    async update(id, dto) {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product || product.isDeleted) {
            throw new common_1.NotFoundException(`Product with ID '${id}' not found.`);
        }
        const data = {};
        if (dto.title !== undefined || dto.name !== undefined) {
            data.title = dto.title || dto.name;
        }
        if (dto.description !== undefined)
            data.description = dto.description;
        if (dto.images !== undefined || dto.image !== undefined || dto.mainImage !== undefined) {
            let imagesList = [];
            if (Array.isArray(dto.images)) {
                imagesList = dto.images.filter((img) => typeof img === 'string' && img.trim().length > 0);
            }
            else if (typeof dto.images === 'string' && dto.images.trim().length > 0) {
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
        if (dto.grossWeight !== undefined)
            data.grossWeight = dto.grossWeight !== '' ? Number(dto.grossWeight) : null;
        if (dto.netGoldWeight !== undefined)
            data.netGoldWeight = dto.netGoldWeight !== '' ? Number(dto.netGoldWeight) : null;
        if (dto.stoneWeight !== undefined)
            data.stoneWeight = dto.stoneWeight !== '' ? Number(dto.stoneWeight) : 0;
        if (dto.purity !== undefined)
            data.purity = dto.purity;
        if (dto.wastagePercent !== undefined)
            data.wastagePercent = dto.wastagePercent !== '' ? Number(dto.wastagePercent) : 0;
        if (dto.bisHallmark !== undefined)
            data.bisHallmark = dto.bisHallmark === 'true' || dto.bisHallmark === true;
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
            data.festivalIds = parseSafeArray(dto.festivalIds)
                .map((item) => typeof item === 'object' ? (item._id || item.id) : item)
                .filter(Boolean);
        }
        if (dto.relationIds !== undefined) {
            data.relationIds = parseSafeArray(dto.relationIds)
                .map((item) => typeof item === 'object' ? (item._id || item.id) : item)
                .filter(Boolean);
        }
        if (dto.collectionIds !== undefined) {
            data.collectionIds = parseSafeArray(dto.collectionIds)
                .map((item) => typeof item === 'object' ? (item._id || item.id) : item)
                .filter(Boolean);
        }
        if (dto.attributes !== undefined || dto.tags !== undefined || dto.sizes !== undefined || dto.shortDescription !== undefined) {
            const existingAttrs = product.attributes && typeof product.attributes === 'object' && !Array.isArray(product.attributes)
                ? { ...product.attributes }
                : {};
            const parsedAttrs = dto.attributes !== undefined ? parseSafeJson(dto.attributes) : undefined;
            const newAttrs = (parsedAttrs && typeof parsedAttrs === 'object' && !Array.isArray(parsedAttrs))
                ? { ...existingAttrs, ...parsedAttrs }
                : { ...existingAttrs };
            const explicitSizes = dto.sizes !== undefined
                ? parseSafeArray(dto.sizes)
                : (parsedAttrs?.sizes !== undefined ? parseSafeArray(parsedAttrs.sizes) : undefined);
            if (explicitSizes !== undefined) {
                newAttrs.sizes = explicitSizes;
            }
            if (dto.tags !== undefined) {
                newAttrs.tags = dto.tags;
                newAttrs.tag = dto.tags;
            }
            if (dto.shortDescription !== undefined) {
                newAttrs.shortDescription = dto.shortDescription;
            }
            data.attributes = newAttrs;
        }
        if (dto.specifications !== undefined) {
            const parsedSpecs = parseSafeJson(dto.specifications);
            data.specifications = Array.isArray(parsedSpecs) ? parsedSpecs : parseSafeArray(dto.specifications);
        }
        if (dto.metalId !== undefined || dto.metalIds !== undefined) {
            const parsedMetals = parseSafeArray(dto.metalIds);
            const mId = dto.metalId || (parsedMetals.length > 0 ? parsedMetals[0] : null);
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
        if (dto.isFeatured !== undefined) {
            data.isFeatured = dto.isFeatured === 'true' || dto.isFeatured === true;
        }
        else if (dto.tags !== undefined) {
            if (String(dto.tags).toLowerCase() === 'bestseller') {
                data.isFeatured = true;
            }
        }
        if (dto.isPublished !== undefined)
            data.isPublished = dto.isPublished === 'true' || dto.isPublished === true;
        const updated = await this.prisma.product.update({
            where: { id },
            data,
        });
        await this.invalidateProductCache(product.slug);
        return updated;
    }
    async delete(id) {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product || product.isDeleted) {
            throw new common_1.NotFoundException(`Product with ID '${id}' not found.`);
        }
        await this.prisma.product.update({
            where: { id },
            data: { isDeleted: true },
        });
        await this.invalidateProductCache(product.slug);
    }
    async toggleBlock(id) {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product || product.isDeleted) {
            throw new common_1.NotFoundException(`Product with ID '${id}' not found.`);
        }
        const updated = await this.prisma.product.update({
            where: { id },
            data: { isPublished: !product.isPublished },
        });
        await this.invalidateProductCache(product.slug);
        return updated;
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], ProductsService);
//# sourceMappingURL=products.service.js.map