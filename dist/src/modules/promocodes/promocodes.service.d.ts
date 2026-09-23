import { PrismaService } from '../prisma/prisma.service';
export declare class PromoCodesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    validatePromoCode(code: string, totalAmount: number): Promise<{
        code: string;
        discountPercent: number;
        discountAmount: number;
        finalAmount: number;
    }>;
    createPromoCode(dto: {
        code: string;
        discountPercent: number;
        maxDiscount?: number;
        validUntil: Date;
    }): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        discountPercent: import("@prisma/client/runtime/library").Decimal;
        code: string;
        maxDiscount: import("@prisma/client/runtime/library").Decimal | null;
        validUntil: Date;
    }>;
}
