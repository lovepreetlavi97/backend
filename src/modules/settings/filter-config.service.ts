import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import slugify from 'slugify';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import {
  GiftStoreConfig,
  PriceFilterDto,
  OccasionDto,
  RecipientDto,
  UpdateGiftStoreConfigDto,
} from './dto/filter-config.dto';

const DEFAULT_GIFT_STORE_CONFIG: GiftStoreConfig = {
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

@Injectable()
export class FilterConfigService {
  private readonly logger = new Logger(FilterConfigService.name);
  private readonly CACHE_KEY = 'cache:gift_store_config:v1';
  private readonly DB_KEY = 'gift_store_config';

  // Single-flight in-memory promise mutex lock to prevent cache stampedes
  private inFlightFetch: Promise<GiftStoreConfig> | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private getTTL(): number {
    const envTTL = process.env.FILTER_CONFIG_CACHE_TTL;
    return envTTL ? parseInt(envTTL, 10) || 300 : 300;
  }

  /**
   * Validate price filter range rules (min < max) and unique constraints
   */
  validateConfig(dto: UpdateGiftStoreConfigDto): void {
    if (dto.priceFilters && Array.isArray(dto.priceFilters)) {
      const priceIds = new Set<string>();
      for (const pf of dto.priceFilters) {
        if (pf.min >= pf.max) {
          throw new BadRequestException(`Invalid price filter: min (${pf.min}) must be strictly less than max (${pf.max})`);
        }
        priceIds.add(pf._id);
      }
    }

    if (dto.occasions && Array.isArray(dto.occasions)) {
      const occasionSlugs = new Set<string>();
      for (const occ of dto.occasions) {
        if (occ.slug && occasionSlugs.has(occ.slug)) {
          throw new BadRequestException(`Duplicate occasion slug detected: '${occ.slug}'`);
        }
        if (occ.slug) {
          occasionSlugs.add(occ.slug);
        }
      }
    }
  }

  /**
   * Get complete Gift Store filter configuration with Redis caching & stampede protection
   */
  async getGiftStoreConfig(): Promise<GiftStoreConfig> {
    // 1. Attempt Redis Cache Lookup
    try {
      const cached = await this.redis.get<GiftStoreConfig>(this.CACHE_KEY);
      if (cached) {
        return cached;
      }
    } catch (err: any) {
      this.logger.warn(`Redis GET failed for ${this.CACHE_KEY}: ${err.message}. Falling back to DB.`);
    }

    // 2. Single-Flight Lock: Prevent Thundering Herd Cache Stampede
    if (this.inFlightFetch) {
      return this.inFlightFetch;
    }

    this.inFlightFetch = this.fetchFromDbAndCache();

    try {
      const result = await this.inFlightFetch;
      return result;
    } finally {
      this.inFlightFetch = null;
    }
  }

  private async fetchFromDbAndCache(): Promise<GiftStoreConfig> {
    let config: GiftStoreConfig;

    try {
      const dbSetting = await this.prisma.setting.findUnique({
        where: { key: this.DB_KEY },
      });

      if (dbSetting && dbSetting.value) {
        config = dbSetting.value as unknown as GiftStoreConfig;
      } else {
        // Auto-seed if not present in DB
        config = DEFAULT_GIFT_STORE_CONFIG;
        await this.prisma.setting.upsert({
          where: { key: this.DB_KEY },
          update: { value: config as any },
          create: { key: this.DB_KEY, value: config as any },
        }).catch((err) => {
          this.logger.error(`Failed to auto-seed filter config in DB: ${err.message}`);
        });
      }
    } catch (dbErr: any) {
      this.logger.error(`PostgreSQL query failed for key '${this.DB_KEY}': ${dbErr.message}`);

      // Attempt fallback to stale cache if PostgreSQL is down
      try {
        const staleCached = await this.redis.get<GiftStoreConfig>(this.CACHE_KEY);
        if (staleCached) {
          this.logger.warn('Serving stale Redis cache due to PostgreSQL outage.');
          return staleCached;
        }
      } catch {}

      return DEFAULT_GIFT_STORE_CONFIG;
    }

    // Populate Redis Cache
    try {
      await this.redis.set(this.CACHE_KEY, config, this.getTTL());
    } catch (redisErr: any) {
      this.logger.warn(`Failed to set Redis cache for ${this.CACHE_KEY}: ${redisErr.message}`);
    }

    return config;
  }

  /**
   * Get price filters list (Public: active only)
   */
  async getPriceFilters(): Promise<PriceFilterDto[]> {
    const config = await this.getGiftStoreConfig();
    const filters = config.priceFilters || DEFAULT_GIFT_STORE_CONFIG.priceFilters;
    return filters.filter((pf: any) => pf.isActive !== false && pf.status !== 'inactive');
  }

  /**
   * Get occasions list (Public: active only)
   */
  async getOccasions(): Promise<OccasionDto[]> {
    const config = await this.getGiftStoreConfig();
    const occasions = config.occasions || DEFAULT_GIFT_STORE_CONFIG.occasions;
    return occasions.filter((o: any) => o.isActive !== false && o.status !== 'inactive');
  }

  /**
   * Get recipients list (Public: active only)
   */
  async getRecipients(): Promise<RecipientDto[]> {
    const config = await this.getGiftStoreConfig();
    const recipients = config.recipients || DEFAULT_GIFT_STORE_CONFIG.recipients;
    return recipients.filter((r: any) => r.isActive !== false && r.status !== 'inactive');
  }

  /**
   * Admin Update Endpoint: Update PostgreSQL, automatically purge and warm Redis cache
   */
  async updateGiftStoreConfig(dto: UpdateGiftStoreConfigDto): Promise<GiftStoreConfig> {
    this.validateConfig(dto);

    // 1. Atomic Database Upsert
    let updatedSetting;
    try {
      updatedSetting = await this.prisma.setting.upsert({
        where: { key: this.DB_KEY },
        update: { value: dto as any },
        create: { key: this.DB_KEY, value: dto as any },
      });
    } catch (err: any) {
      this.logger.error(`Failed to update gift store config in DB: ${err.message}`);
      throw new InternalServerErrorException('Failed to update filter configuration in database.');
    }

    const newConfig = updatedSetting.value as unknown as GiftStoreConfig;

    // 2. Automatic Redis Cache Invalidation & Warming
    await this.invalidateGiftStoreConfigCache();

    try {
      await this.redis.set(this.CACHE_KEY, newConfig, this.getTTL());
    } catch (redisErr: any) {
      this.logger.warn(`Failed to re-warm Redis cache after update: ${redisErr.message}`);
    }

    return newConfig;
  }

  /**
   * Invalidate Redis Cache Key
   */
  async invalidateGiftStoreConfigCache(): Promise<void> {
    try {
      await this.redis.del(this.CACHE_KEY);
      await this.redis.del('cache:festivals_public');
      await this.redis.delPattern('cache:festivals_public*');
      this.logger.log(`Redis cache invalidated for ${this.CACHE_KEY} and festivals`);
    } catch (err: any) {
      this.logger.warn(`Redis cache invalidation failed for ${this.CACHE_KEY}: ${err.message}`);
    }
  }

  /**
   * Manually force refresh Redis cache from DB
   */
  async refreshGiftStoreConfigCache(): Promise<GiftStoreConfig> {
    await this.invalidateGiftStoreConfigCache();
    return this.fetchFromDbAndCache();
  }

  async getOccasionsList() {
    const config = await this.getGiftStoreConfig();
    return config.occasions || [];
  }

  async addOccasion(dto: any) {
    const config = await this.getGiftStoreConfig();
    const occasions = config.occasions || [];
    let baseSlug = slugify(dto.name || 'festival', { lower: true, strict: true }) || 'festival';
    let finalSlug = baseSlug;
    if (occasions.some((o: any) => o.slug === finalSlug)) {
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
    config.occasions = occasions;
    config.priceFilters = config.priceFilters || DEFAULT_GIFT_STORE_CONFIG.priceFilters;
    config.recipients = config.recipients || DEFAULT_GIFT_STORE_CONFIG.recipients;
    await this.updateGiftStoreConfig(config);
    return newOccasion;
  }

  async updateOccasion(id: string, dto: any) {
    const config = await this.getGiftStoreConfig();
    const occasions = config.occasions || [];
    const index = occasions.findIndex((o: any) => o._id === id);
    if (index === -1) throw new NotFoundException('Occasion not found');

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
    config.occasions = occasions;
    config.priceFilters = config.priceFilters || DEFAULT_GIFT_STORE_CONFIG.priceFilters;
    config.recipients = config.recipients || DEFAULT_GIFT_STORE_CONFIG.recipients;
    await this.updateGiftStoreConfig(config);
    return occasions[index];
  }

  async deleteOccasion(id: string) {
    const config = await this.getGiftStoreConfig();
    const occasions = config.occasions || [];
    const filtered = occasions.filter((o: any) => o._id !== id);
    config.occasions = filtered;
    await this.updateGiftStoreConfig(config);
    return { success: true };
  }

  async getRecipientsList() {
    const config = await this.getGiftStoreConfig();
    return config.recipients || [];
  }

  async addRecipient(dto: any) {
    const config = await this.getGiftStoreConfig();
    const recipients = config.recipients || [];
    const newRecipient = {
      _id: Math.random().toString(36).slice(2, 11),
      name: dto.name,
      description: dto.description || '',
      image: dto.image || dto.icon || '',
      icon: dto.image || dto.icon || '',
      slug: slugify(dto.name || 'relation', { lower: true, strict: true }),
      isActive: dto.isActive !== undefined ? (dto.isActive === true || dto.isActive === 'true') : true,
    };
    recipients.unshift(newRecipient);
    config.recipients = recipients;
    await this.updateGiftStoreConfig(config);
    return newRecipient;
  }

  async updateRecipient(id: string, dto: any) {
    const config = await this.getGiftStoreConfig();
    const recipients = config.recipients || [];
    const index = recipients.findIndex((r: any) => r._id === id);
    if (index === -1) throw new NotFoundException('Recipient not found');
    recipients[index] = {
      ...recipients[index],
      ...dto,
      name: dto.name !== undefined ? dto.name : recipients[index].name,
      description: dto.description !== undefined ? dto.description : recipients[index].description,
      image: dto.image !== undefined ? dto.image : recipients[index].image,
      icon: dto.icon !== undefined ? dto.icon : (dto.image !== undefined ? dto.image : recipients[index].icon),
      slug: dto.name ? slugify(dto.name, { lower: true, strict: true }) : recipients[index].slug,
    };
    config.recipients = recipients;
    await this.updateGiftStoreConfig(config);
    return recipients[index];
  }

  async deleteRecipient(id: string) {
    const config = await this.getGiftStoreConfig();
    const recipients = config.recipients || [];
    const filtered = recipients.filter((r: any) => r._id !== id);
    config.recipients = filtered;
    await this.updateGiftStoreConfig(config);
    return { success: true };
  }
}
