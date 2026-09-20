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
var FilterConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterConfigService = void 0;
const common_1 = require("@nestjs/common");
const slugify_1 = require("slugify");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../../shared/redis/redis.service");
const DEFAULT_GIFT_STORE_CONFIG = {
    banner: {
        title: 'The Gift Store',
        description: 'Discover the art of giving with our curated collections for every milestone.',
        imageUrl: '/uploads/gifts/gift_store_banner.png',
    },
    occasions: [
        { _id: '1', name: 'Anniversary', slug: 'anniversary', image: '/uploads/gifts/anniversary.png' },
        { _id: '2', name: 'Birthday', slug: 'birthday', image: '/uploads/gifts/birthday.png' },
        { _id: '3', name: "Valentine's Day", slug: 'valentines-day', image: '/uploads/gifts/valentine.png' },
        { _id: '4', name: 'Wedding', slug: 'wedding', image: '/uploads/gifts/wedding.png' },
    ],
    priceFilters: [
        { _id: '1', min: 0, max: 10000, label: 'Under ₹10,000' },
        { _id: '2', min: 10000, max: 25000, label: '₹10,000 - ₹25,000' },
        { _id: '3', min: 25000, max: 50000, label: '₹25,000 - ₹50,000' },
        { _id: '4', min: 50000, max: 100000, label: '₹50,000 - ₹1,00,000' },
        { _id: '5', min: 100000, max: 9999999, label: 'Above ₹1,00,000' },
    ],
    recipients: [
        { _id: '1', name: 'Wife', slug: 'wife' },
        { _id: '2', name: 'Husband', slug: 'husband' },
        { _id: '3', name: 'Mother', slug: 'mother' },
        { _id: '4', name: 'Daughter', slug: 'daughter' },
        { _id: '5', name: 'Friend', slug: 'friend' },
    ],
};
let FilterConfigService = FilterConfigService_1 = class FilterConfigService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.logger = new common_1.Logger(FilterConfigService_1.name);
        this.CACHE_KEY = 'cache:gift_store_config:v1';
        this.DB_KEY = 'gift_store_config';
        this.inFlightFetch = null;
    }
    getTTL() {
        const envTTL = process.env.FILTER_CONFIG_CACHE_TTL;
        return envTTL ? parseInt(envTTL, 10) || 300 : 300;
    }
    validateConfig(dto) {
        if (dto.priceFilters && Array.isArray(dto.priceFilters)) {
            const priceIds = new Set();
            for (const pf of dto.priceFilters) {
                if (pf.min >= pf.max) {
                    throw new common_1.BadRequestException(`Invalid price filter: min (${pf.min}) must be strictly less than max (${pf.max})`);
                }
                priceIds.add(pf._id);
            }
        }
        if (dto.occasions && Array.isArray(dto.occasions)) {
            const occasionSlugs = new Set();
            for (const occ of dto.occasions) {
                if (occ.slug && occasionSlugs.has(occ.slug)) {
                    throw new common_1.BadRequestException(`Duplicate occasion slug detected: '${occ.slug}'`);
                }
                if (occ.slug) {
                    occasionSlugs.add(occ.slug);
                }
            }
        }
    }
    async getGiftStoreConfig() {
        try {
            const cached = await this.redis.get(this.CACHE_KEY);
            if (cached) {
                return cached;
            }
        }
        catch (err) {
            this.logger.warn(`Redis GET failed for ${this.CACHE_KEY}: ${err.message}. Falling back to DB.`);
        }
        if (this.inFlightFetch) {
            return this.inFlightFetch;
        }
        this.inFlightFetch = this.fetchFromDbAndCache();
        try {
            const result = await this.inFlightFetch;
            return result;
        }
        finally {
            this.inFlightFetch = null;
        }
    }
    async fetchFromDbAndCache() {
        let config;
        try {
            const dbSetting = await this.prisma.setting.findUnique({
                where: { key: this.DB_KEY },
            });
            if (dbSetting && dbSetting.value) {
                config = dbSetting.value;
            }
            else {
                config = DEFAULT_GIFT_STORE_CONFIG;
                await this.prisma.setting.upsert({
                    where: { key: this.DB_KEY },
                    update: { value: config },
                    create: { key: this.DB_KEY, value: config },
                }).catch((err) => {
                    this.logger.error(`Failed to auto-seed filter config in DB: ${err.message}`);
                });
            }
        }
        catch (dbErr) {
            this.logger.error(`PostgreSQL query failed for key '${this.DB_KEY}': ${dbErr.message}`);
            try {
                const staleCached = await this.redis.get(this.CACHE_KEY);
                if (staleCached) {
                    this.logger.warn('Serving stale Redis cache due to PostgreSQL outage.');
                    return staleCached;
                }
            }
            catch { }
            return DEFAULT_GIFT_STORE_CONFIG;
        }
        try {
            await this.redis.set(this.CACHE_KEY, config, this.getTTL());
        }
        catch (redisErr) {
            this.logger.warn(`Failed to set Redis cache for ${this.CACHE_KEY}: ${redisErr.message}`);
        }
        return config;
    }
    async getPriceFilters() {
        const config = await this.getGiftStoreConfig();
        const filters = config.priceFilters || DEFAULT_GIFT_STORE_CONFIG.priceFilters;
        return filters.filter((pf) => pf.isActive !== false && pf.status !== 'inactive');
    }
    async getOccasions() {
        const config = await this.getGiftStoreConfig();
        const occasions = config.occasions || DEFAULT_GIFT_STORE_CONFIG.occasions;
        return occasions.filter((o) => o.isActive !== false && o.status !== 'inactive');
    }
    async getRecipients() {
        const config = await this.getGiftStoreConfig();
        const recipients = config.recipients || DEFAULT_GIFT_STORE_CONFIG.recipients;
        return recipients.filter((r) => r.isActive !== false && r.status !== 'inactive');
    }
    async updateGiftStoreConfig(dto) {
        this.validateConfig(dto);
        let updatedSetting;
        try {
            updatedSetting = await this.prisma.setting.upsert({
                where: { key: this.DB_KEY },
                update: { value: dto },
                create: { key: this.DB_KEY, value: dto },
            });
        }
        catch (err) {
            this.logger.error(`Failed to update gift store config in DB: ${err.message}`);
            throw new common_1.InternalServerErrorException('Failed to update filter configuration in database.');
        }
        const newConfig = updatedSetting.value;
        await this.invalidateGiftStoreConfigCache();
        try {
            await this.redis.set(this.CACHE_KEY, newConfig, this.getTTL());
        }
        catch (redisErr) {
            this.logger.warn(`Failed to re-warm Redis cache after update: ${redisErr.message}`);
        }
        return newConfig;
    }
    async invalidateGiftStoreConfigCache() {
        try {
            await this.redis.del(this.CACHE_KEY);
            await this.redis.del('cache:festivals_public');
            await this.redis.delPattern('cache:festivals_public*');
            this.logger.log(`Redis cache invalidated for ${this.CACHE_KEY} and festivals`);
        }
        catch (err) {
            this.logger.warn(`Redis cache invalidation failed for ${this.CACHE_KEY}: ${err.message}`);
        }
    }
    async refreshGiftStoreConfigCache() {
        await this.invalidateGiftStoreConfigCache();
        return this.fetchFromDbAndCache();
    }
    async getOccasionsList() {
        const config = await this.getGiftStoreConfig();
        return config.occasions || [];
    }
    async addOccasion(dto) {
        const config = await this.getGiftStoreConfig();
        const occasions = config.occasions || [];
        let baseSlug = (0, slugify_1.default)(dto.name || 'festival', { lower: true, strict: true }) || 'festival';
        let finalSlug = baseSlug;
        if (occasions.some((o) => o.slug === finalSlug)) {
            finalSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
        }
        const rawImg = typeof dto.image === 'string' ? dto.image : (typeof dto.mainImage === 'string' ? dto.mainImage : '');
        const newOccasion = {
            _id: Math.random().toString(36).slice(2, 11),
            name: dto.name || 'Festival',
            description: dto.description || '',
            slug: finalSlug,
            image: rawImg,
            link: dto.link || dto.url || '',
            startDate: dto.startDate || '',
            endDate: dto.endDate || '',
            metalIds: Array.isArray(dto.metalIds) ? dto.metalIds : dto.metalIds ? [dto.metalIds] : [],
            isActive: dto.isActive === 'false' || dto.isActive === false ? false : true,
        };
        occasions.unshift(newOccasion);
        config.banner = config.banner || DEFAULT_GIFT_STORE_CONFIG.banner;
        config.occasions = occasions;
        config.priceFilters = config.priceFilters || DEFAULT_GIFT_STORE_CONFIG.priceFilters;
        config.recipients = config.recipients || DEFAULT_GIFT_STORE_CONFIG.recipients;
        await this.updateGiftStoreConfig(config);
        return newOccasion;
    }
    async updateOccasion(id, dto) {
        const config = await this.getGiftStoreConfig();
        const occasions = config.occasions || [];
        const index = occasions.findIndex((o) => o._id === id);
        if (index === -1)
            throw new common_1.NotFoundException('Occasion not found');
        const currentImg = typeof occasions[index].image === 'string' ? occasions[index].image : '';
        const newImg = typeof dto.image === 'string' ? dto.image : (typeof dto.mainImage === 'string' ? dto.mainImage : currentImg);
        occasions[index] = {
            ...occasions[index],
            ...dto,
            image: newImg,
            metalIds: Array.isArray(dto.metalIds) ? dto.metalIds : dto.metalIds ? [dto.metalIds] : occasions[index].metalIds || [],
            isActive: dto.isActive !== undefined ? (dto.isActive === 'false' || dto.isActive === false ? false : true) : occasions[index].isActive,
            link: dto.link !== undefined ? dto.link : dto.url !== undefined ? dto.url : occasions[index].link || '',
        };
        config.banner = config.banner || DEFAULT_GIFT_STORE_CONFIG.banner;
        config.occasions = occasions;
        config.priceFilters = config.priceFilters || DEFAULT_GIFT_STORE_CONFIG.priceFilters;
        config.recipients = config.recipients || DEFAULT_GIFT_STORE_CONFIG.recipients;
        await this.updateGiftStoreConfig(config);
        return occasions[index];
    }
    async deleteOccasion(id) {
        const config = await this.getGiftStoreConfig();
        const occasions = config.occasions || [];
        const filtered = occasions.filter((o) => o._id !== id);
        config.banner = config.banner || DEFAULT_GIFT_STORE_CONFIG.banner;
        config.occasions = filtered;
        config.priceFilters = config.priceFilters || DEFAULT_GIFT_STORE_CONFIG.priceFilters;
        config.recipients = config.recipients || DEFAULT_GIFT_STORE_CONFIG.recipients;
        await this.updateGiftStoreConfig(config);
        return { success: true };
    }
    async getRecipientsList() {
        const config = await this.getGiftStoreConfig();
        return config.recipients || [];
    }
    async addRecipient(dto) {
        const config = await this.getGiftStoreConfig();
        const recipients = config.recipients || [];
        const newRecipient = {
            _id: Math.random().toString(36).slice(2, 11),
            name: dto.name,
            description: dto.description || '',
            image: dto.image || dto.icon || '',
            icon: dto.image || dto.icon || '',
            slug: (0, slugify_1.default)(dto.name || 'relation', { lower: true, strict: true }),
            isActive: dto.isActive !== undefined ? (dto.isActive === true || dto.isActive === 'true') : true,
        };
        recipients.unshift(newRecipient);
        config.recipients = recipients;
        await this.updateGiftStoreConfig(config);
        return newRecipient;
    }
    async updateRecipient(id, dto) {
        const config = await this.getGiftStoreConfig();
        const recipients = config.recipients || [];
        const index = recipients.findIndex((r) => r._id === id);
        if (index === -1)
            throw new common_1.NotFoundException('Recipient not found');
        recipients[index] = {
            ...recipients[index],
            ...dto,
            name: dto.name !== undefined ? dto.name : recipients[index].name,
            description: dto.description !== undefined ? dto.description : recipients[index].description,
            image: dto.image !== undefined ? dto.image : recipients[index].image,
            icon: dto.icon !== undefined ? dto.icon : (dto.image !== undefined ? dto.image : recipients[index].icon),
            slug: dto.name ? (0, slugify_1.default)(dto.name, { lower: true, strict: true }) : recipients[index].slug,
        };
        config.recipients = recipients;
        await this.updateGiftStoreConfig(config);
        return recipients[index];
    }
    async deleteRecipient(id) {
        const config = await this.getGiftStoreConfig();
        const recipients = config.recipients || [];
        const filtered = recipients.filter((r) => r._id !== id);
        config.recipients = filtered;
        await this.updateGiftStoreConfig(config);
        return { success: true };
    }
};
exports.FilterConfigService = FilterConfigService;
exports.FilterConfigService = FilterConfigService = FilterConfigService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], FilterConfigService);
//# sourceMappingURL=filter-config.service.js.map