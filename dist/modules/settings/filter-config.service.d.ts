import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { GiftStoreConfig, PriceFilterDto, OccasionDto, RecipientDto, UpdateGiftStoreConfigDto } from './dto/filter-config.dto';
export declare class FilterConfigService {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    private readonly CACHE_KEY;
    private readonly DB_KEY;
    private inFlightFetch;
    constructor(prisma: PrismaService, redis: RedisService);
    private getTTL;
    validateConfig(dto: UpdateGiftStoreConfigDto): void;
    getGiftStoreConfig(): Promise<GiftStoreConfig>;
    private fetchFromDbAndCache;
    getPriceFilters(): Promise<PriceFilterDto[]>;
    getOccasions(): Promise<OccasionDto[]>;
    getRecipients(): Promise<RecipientDto[]>;
    updateGiftStoreConfig(dto: UpdateGiftStoreConfigDto): Promise<GiftStoreConfig>;
    invalidateGiftStoreConfigCache(): Promise<void>;
    refreshGiftStoreConfigCache(): Promise<GiftStoreConfig>;
    getOccasionsList(): Promise<OccasionDto[]>;
    addOccasion(dto: any): Promise<{
        _id: string;
        name: any;
        description: any;
        slug: string;
        image: any;
        link: any;
        startDate: any;
        endDate: any;
        metalIds: any;
        isActive: boolean;
    }>;
    updateOccasion(id: string, dto: any): Promise<OccasionDto>;
    deleteOccasion(id: string): Promise<{
        success: boolean;
    }>;
    getRecipientsList(): Promise<RecipientDto[]>;
    addRecipient(dto: any): Promise<{
        _id: string;
        name: any;
        description: any;
        image: any;
        icon: any;
        slug: string;
        isActive: boolean;
    }>;
    updateRecipient(id: string, dto: any): Promise<RecipientDto>;
    deleteRecipient(id: string): Promise<{
        success: boolean;
    }>;
}
