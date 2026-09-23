import { PricesService } from './prices.service';
import { CreatePriceRuleDto, UpdatePriceRuleDto } from './dto/price-rule.dto';
export declare class PricesController {
    private readonly pricesService;
    constructor(pricesService: PricesService);
    getPriceRules(page?: string, limit?: string, search?: string): Promise<{
        status: string;
        data: {
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
        };
    }>;
    createPriceRule(dto: CreatePriceRuleDto): Promise<{
        status: string;
        message: string;
        data: {
            priceRule: {
                _id: string;
                name: string;
                price: number;
                isActive: boolean;
            };
        };
    }>;
    updatePriceRule(id: string, dto: UpdatePriceRuleDto): Promise<{
        status: string;
        message: string;
        data: {
            priceRule: {
                id: string;
                name: string;
                updatedAt: Date;
                makingChargeGram: import("@prisma/client/runtime/library").Decimal;
                gstPercentage: import("@prisma/client/runtime/library").Decimal;
                discountPercent: import("@prisma/client/runtime/library").Decimal;
            };
        };
    }>;
    deletePriceRule(id: string): Promise<{
        status: string;
        message: string;
    }>;
    toggleStatus(id: string): Promise<{
        status: string;
        message: string;
    }>;
}
