export declare class BannerConfigDto {
    title: string;
    description: string;
    imageUrl: string;
}
export declare class OccasionDto {
    _id: string;
    name: string;
    slug: string;
    image?: string;
    description?: string;
    link?: string;
    startDate?: string;
    endDate?: string;
    metalIds?: string[];
    isActive?: boolean;
}
export declare class PriceFilterDto {
    _id: string;
    min: number;
    max: number;
    label: string;
}
export declare class RecipientDto {
    _id: string;
    name: string;
    slug: string;
}
export declare class UpdateGiftStoreConfigDto {
    banner: BannerConfigDto;
    occasions: OccasionDto[];
    priceFilters: PriceFilterDto[];
    recipients: RecipientDto[];
}
export interface GiftStoreConfig {
    banner: BannerConfigDto;
    occasions: OccasionDto[];
    priceFilters: PriceFilterDto[];
    recipients: RecipientDto[];
}
