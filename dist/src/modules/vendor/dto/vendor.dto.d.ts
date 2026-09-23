export declare class RegisterVendorDto {
    shopName: string;
    legalName?: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstin?: string;
}
export declare class UpdateVendorProfileDto {
    shopName?: string;
    legalName?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstin?: string;
}
export declare class CreateVendorProductDto {
    title: string;
    description: string;
    images?: string[];
    weightGrams: number;
    stockQuantity: number;
    categoryId?: string;
    subcategoryId?: string;
    metalId?: string;
    priceRuleId?: string;
    submitForApproval?: boolean;
}
export declare class UpdateVendorProductDto {
    title?: string;
    description?: string;
    images?: string[];
    weightGrams?: number;
    stockQuantity?: number;
    categoryId?: string;
    subcategoryId?: string;
    metalId?: string;
    priceRuleId?: string;
    submitForApproval?: boolean;
}
export declare class RejectReasonDto {
    reason: string;
}
export declare class UpdateShipmentDto {
    trackingNumber: string;
    carrier: string;
}
