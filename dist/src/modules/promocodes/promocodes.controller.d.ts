import { PromoCodesService } from './promocodes.service';
export declare class PromoCodesController {
    private readonly promoCodesService;
    constructor(promoCodesService: PromoCodesService);
    validate(dto: {
        code: string;
        totalAmount: number;
    }): Promise<{
        status: string;
        data: {
            code: string;
            discountPercent: number;
            discountAmount: number;
            finalAmount: number;
        };
    }>;
    createPromo(dto: {
        code: string;
        discountPercent: number;
        maxDiscount?: number;
        validUntil: string;
    }): Promise<{
        status: string;
        message: string;
        data: {
            promo: {
                id: string;
                isActive: boolean;
                createdAt: Date;
                discountPercent: import("@prisma/client/runtime/library").Decimal;
                code: string;
                maxDiscount: import("@prisma/client/runtime/library").Decimal | null;
                validUntil: Date;
            };
        };
    }>;
}
