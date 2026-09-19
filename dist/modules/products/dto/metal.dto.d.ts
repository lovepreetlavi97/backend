export declare class CreateMetalDto {
    name: string;
    slug: string;
    colorCode?: string;
    gradient?: string;
    ratePerGram?: number;
    purity?: string;
    isActive?: boolean;
}
export declare class UpdateMetalDto {
    name?: string;
    slug?: string;
    colorCode?: string;
    gradient?: string;
    ratePerGram?: number;
    purity?: string;
    isActive?: boolean;
}
