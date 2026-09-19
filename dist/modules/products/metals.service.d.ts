import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { CreateMetalDto, UpdateMetalDto } from './dto/metal.dto';
export interface MetalLinkedInfo {
    activeProducts: number;
    totalProducts: number;
    banners: number;
    isLinked: boolean;
}
export declare class MetalsService {
    private readonly prisma;
    private readonly redis;
    constructor(prisma: PrismaService, redis: RedisService);
    private mapMetal;
    getMetalLinkedCounts(metalId: string, metalSlug?: string): Promise<MetalLinkedInfo>;
    getMetals(status?: string): Promise<{
        _id: any;
        name: any;
        slug: any;
        colorCode: any;
        gradient: any;
        isActive: any;
        type: any;
        ratePerGram: number;
        purity: any;
        linkedProductsCount: number;
        activeProductsCount: number;
        linkedBannersCount: number;
        isLinked: boolean;
        createdAt: any;
        updatedAt: any;
    }[]>;
    getMetal(id: string): Promise<{
        _id: any;
        name: any;
        slug: any;
        colorCode: any;
        gradient: any;
        isActive: any;
        type: any;
        ratePerGram: number;
        purity: any;
        linkedProductsCount: number;
        activeProductsCount: number;
        linkedBannersCount: number;
        isLinked: boolean;
        createdAt: any;
        updatedAt: any;
    }>;
    createMetal(dto: CreateMetalDto): Promise<{
        _id: any;
        name: any;
        slug: any;
        colorCode: any;
        gradient: any;
        isActive: any;
        type: any;
        ratePerGram: number;
        purity: any;
        linkedProductsCount: number;
        activeProductsCount: number;
        linkedBannersCount: number;
        isLinked: boolean;
        createdAt: any;
        updatedAt: any;
    }>;
    updateMetal(id: string, dto: UpdateMetalDto): Promise<{
        _id: any;
        name: any;
        slug: any;
        colorCode: any;
        gradient: any;
        isActive: any;
        type: any;
        ratePerGram: number;
        purity: any;
        linkedProductsCount: number;
        activeProductsCount: number;
        linkedBannersCount: number;
        isLinked: boolean;
        createdAt: any;
        updatedAt: any;
    }>;
    deleteMetal(id: string): Promise<void>;
}
