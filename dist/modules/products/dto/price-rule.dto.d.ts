export declare class CreatePriceRuleDto {
    name: string;
    price?: number;
    makingChargeGram?: number;
    gstPercentage?: number;
    discountPercent?: number;
    isActive?: boolean;
}
export declare class UpdatePriceRuleDto {
    name?: string;
    price?: number;
    makingChargeGram?: number;
    gstPercentage?: number;
    discountPercent?: number;
    isActive?: boolean;
}
