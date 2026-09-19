import { PromoCodesService } from './promocodes.service';
export declare class PromoCodesController {
    private readonly promoCodesService;
    constructor(promoCodesService: PromoCodesService);
    getActivePromos(productDetail?: string): Promise<{
        status: string;
        data: {
            promos: {
                _id: any;
                id: any;
                code: any;
                type: any;
                value: number;
                discountPercent: number;
                maxDiscount: number;
                minPurchase: number;
                minOrderValue: number;
                startDate: any;
                endDate: any;
                validUntil: any;
                usageLimit: any;
                usageCount: any;
                description: any;
                showInProductDetail: any;
                status: string;
                isActive: any;
                createdAt: any;
                updatedAt: any;
            }[];
        };
    }>;
    validate(dto: {
        code: string;
        totalAmount?: number;
    }): Promise<{
        status: string;
        data: {
            code: string;
            discountPercent: number;
            discountAmount: number;
            finalAmount: number;
            discountType: string;
            discountValue: number;
            maxDiscount: number;
            minOrderValue: number;
            description: string;
            promo: {
                code: string;
                discountType: string;
                discountValue: number;
                discountPercent: number;
                maxDiscount: number;
                minOrderValue: number;
                description: string;
            };
        };
        promo: {
            code: string;
            discountType: string;
            discountValue: number;
            discountPercent: number;
            maxDiscount: number;
            minOrderValue: number;
            description: string;
        };
    }>;
    validateByParam(code: string, totalAmount?: string): Promise<{
        status: string;
        data: {
            code: string;
            discountPercent: number;
            discountAmount: number;
            finalAmount: number;
            discountType: string;
            discountValue: number;
            maxDiscount: number;
            minOrderValue: number;
            description: string;
            promo: {
                code: string;
                discountType: string;
                discountValue: number;
                discountPercent: number;
                maxDiscount: number;
                minOrderValue: number;
                description: string;
            };
        };
        promo: {
            code: string;
            discountType: string;
            discountValue: number;
            discountPercent: number;
            maxDiscount: number;
            minOrderValue: number;
            description: string;
        };
    }>;
    getAllPromoCodes(pageStr?: string, limitStr?: string, search?: string, status?: string): Promise<{
        status: string;
        data: {
            promoCodes: {
                _id: any;
                id: any;
                code: any;
                type: any;
                value: number;
                discountPercent: number;
                maxDiscount: number;
                minPurchase: number;
                minOrderValue: number;
                startDate: any;
                endDate: any;
                validUntil: any;
                usageLimit: any;
                usageCount: any;
                description: any;
                showInProductDetail: any;
                status: string;
                isActive: any;
                createdAt: any;
                updatedAt: any;
            }[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                pages: number;
            };
        };
    }>;
    getPromoById(id: string): Promise<{
        status: string;
        data: {
            promoCode: {
                _id: any;
                id: any;
                code: any;
                type: any;
                value: number;
                discountPercent: number;
                maxDiscount: number;
                minPurchase: number;
                minOrderValue: number;
                startDate: any;
                endDate: any;
                validUntil: any;
                usageLimit: any;
                usageCount: any;
                description: any;
                showInProductDetail: any;
                status: string;
                isActive: any;
                createdAt: any;
                updatedAt: any;
            };
        };
    }>;
    createPromo(dto: any): Promise<{
        status: string;
        message: string;
        data: {
            promoCode: {
                _id: any;
                id: any;
                code: any;
                type: any;
                value: number;
                discountPercent: number;
                maxDiscount: number;
                minPurchase: number;
                minOrderValue: number;
                startDate: any;
                endDate: any;
                validUntil: any;
                usageLimit: any;
                usageCount: any;
                description: any;
                showInProductDetail: any;
                status: string;
                isActive: any;
                createdAt: any;
                updatedAt: any;
            };
        };
    }>;
    updatePromo(id: string, dto: any): Promise<{
        status: string;
        message: string;
        data: {
            promoCode: {
                _id: any;
                id: any;
                code: any;
                type: any;
                value: number;
                discountPercent: number;
                maxDiscount: number;
                minPurchase: number;
                minOrderValue: number;
                startDate: any;
                endDate: any;
                validUntil: any;
                usageLimit: any;
                usageCount: any;
                description: any;
                showInProductDetail: any;
                status: string;
                isActive: any;
                createdAt: any;
                updatedAt: any;
            };
        };
    }>;
    deletePromo(id: string): Promise<{
        status: string;
        message: string;
    }>;
    togglePromoStatus(id: string): Promise<{
        status: string;
        message: string;
        data: {
            promoCode: {
                _id: any;
                id: any;
                code: any;
                type: any;
                value: number;
                discountPercent: number;
                maxDiscount: number;
                minPurchase: number;
                minOrderValue: number;
                startDate: any;
                endDate: any;
                validUntil: any;
                usageLimit: any;
                usageCount: any;
                description: any;
                showInProductDetail: any;
                status: string;
                isActive: any;
                createdAt: any;
                updatedAt: any;
            };
        };
    }>;
    toggleProductDetail(id: string): Promise<{
        status: string;
        message: string;
        data: {
            promoCode: {
                _id: any;
                id: any;
                code: any;
                type: any;
                value: number;
                discountPercent: number;
                maxDiscount: number;
                minPurchase: number;
                minOrderValue: number;
                startDate: any;
                endDate: any;
                validUntil: any;
                usageLimit: any;
                usageCount: any;
                description: any;
                showInProductDetail: any;
                status: string;
                isActive: any;
                createdAt: any;
                updatedAt: any;
            };
        };
    }>;
}
