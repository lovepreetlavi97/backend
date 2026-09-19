import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { CreatePriceRuleDto, UpdatePriceRuleDto } from './dto/price-rule.dto';
export declare class PricesService {
    private readonly prisma;
    private readonly redis;
    constructor(prisma: PrismaService, redis: RedisService);
    getPriceRules(pageStr?: string, limitStr?: string, search?: string): Promise<{
        priceRules: {
            _id: string;
            name: string;
            price: number;
            makingChargeGram: number;
            gstPercentage: number;
            discountPercent: number;
            isActive: boolean;
            linkedProductsCount: number;
            isLinked: boolean;
            createdAt: string;
            updatedAt: string;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getPriceRuleById(id: string): Promise<{
        _id: string;
        name: string;
        price: number;
        makingChargeGram: number;
        gstPercentage: number;
        discountPercent: number;
        isActive: boolean;
        linkedProductsCount: number;
        isLinked: boolean;
    }>;
    createPriceRule(dto: CreatePriceRuleDto): Promise<{
        _id: string;
        name: string;
        price: number;
        makingChargeGram: number;
        gstPercentage: number;
        discountPercent: number;
        isActive: boolean;
    }>;
    updatePriceRule(id: string, dto: UpdatePriceRuleDto): Promise<{
        _id: string;
        name: string;
        price: number;
        makingChargeGram: number;
        gstPercentage: number;
        discountPercent: number;
        isActive: boolean;
    }>;
    deletePriceRule(id: string): Promise<void>;
    toggleStatus(id: string): Promise<{
        status: string;
        message: string;
    }>;
}
