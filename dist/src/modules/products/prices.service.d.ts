import { PrismaService } from '../prisma/prisma.service';
import { CreatePriceRuleDto, UpdatePriceRuleDto } from './dto/price-rule.dto';
export declare class PricesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPriceRules(pageStr?: string, limitStr?: string, search?: string): Promise<{
        priceRules: {
            _id: string;
            name: string;
            price: number;
            makingChargeGram: number;
            gstPercentage: number;
            discountPercent: number;
            isActive: boolean;
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
    createPriceRule(dto: CreatePriceRuleDto): Promise<{
        _id: string;
        name: string;
        price: number;
        isActive: boolean;
    }>;
    updatePriceRule(id: string, dto: UpdatePriceRuleDto): Promise<{
        id: string;
        name: string;
        updatedAt: Date;
        makingChargeGram: import("@prisma/client/runtime/library").Decimal;
        gstPercentage: import("@prisma/client/runtime/library").Decimal;
        discountPercent: import("@prisma/client/runtime/library").Decimal;
    }>;
    deletePriceRule(id: string): Promise<void>;
}
