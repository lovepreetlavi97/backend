import { ProductsService } from './products.service';
import { PublicCatalogService } from './public-catalog.service';
import { FilterConfigService } from '../settings/filter-config.service';
export declare class PublicController {
    private readonly productsService;
    private readonly publicCatalogService;
    private readonly filterConfigService;
    constructor(productsService: ProductsService, publicCatalogService: PublicCatalogService, filterConfigService: FilterConfigService);
    getHomepage(): Promise<any>;
    getCategoryMenu(metalId?: string): Promise<any>;
    getCuratedCollectionsAdmin(): Promise<{
        status: string;
        data: {
            curated: {
                _id: any;
                id: any;
                name: any;
                slug: any;
                image: any;
                isActive: boolean;
                position: number;
                createdAt: string;
            }[];
            collections: {
                _id: any;
                id: any;
                name: any;
                slug: any;
                image: any;
                isActive: boolean;
                position: number;
                createdAt: string;
            }[];
        };
    }>;
    getCuratedCollectionsPublic(): Promise<{
        status: string;
        data: {
            collections: {
                _id: string;
                name: string;
                slug: string;
                image: string;
                mainImage: string;
                description: string;
            }[];
            curated: {
                _id: string;
                name: string;
                slug: string;
                image: string;
                mainImage: string;
                description: string;
            }[];
        };
    }>;
    getGiftFilters(): Promise<{
        status: string;
        data: import("../settings/dto/filter-config.dto").GiftStoreConfig;
    }>;
    getPriceFilters(): Promise<{
        status: string;
        data: {
            priceFilters: import("../settings/dto/filter-config.dto").PriceFilterDto[];
        };
    }>;
    getRelations(): Promise<{
        status: string;
        data: import("../settings/dto/filter-config.dto").RecipientDto[];
    }>;
    getEssentials(metalId?: string): Promise<any>;
    getTrendingProducts(metalId?: string, limit?: number): Promise<any>;
    getCuratedCollections(): Promise<any>;
    getFestivals(metalId?: string): Promise<any>;
    getHomeSearch(queryStr?: string): Promise<{
        status: string;
        data: {
            subcategories: {
                name: string;
                description: string | null;
                id: string;
                isDeleted: boolean;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                categoryId: string;
                image: string | null;
            }[];
            products: {
                _id: any;
                id: any;
                name: any;
                title: any;
                slug: any;
                sku: any;
                description: any;
                image: any;
                mainImage: any;
                images: any;
                tags: any;
                tag: any;
                weight: number;
                weightGrams: number;
                grossWeight: number;
                netGoldWeight: number;
                stoneWeight: number;
                purity: any;
                wastagePercent: number;
                bisHallmark: any;
                stock: any;
                stockQuantity: any;
                isActive: any;
                isPublished: any;
                isFeatured: any;
                isPriceFixed: any;
                actualPrice: number;
                discountedPrice: number;
                festivalIds: any;
                relationIds: any;
                collectionIds: any;
                attributes: any;
                sizes: any;
                specifications: any;
                metalId: any;
                categoryId: any;
                subcategoryId: any;
                priceRuleId: any;
                calculatedPrice: import("./products.service").CalculatedProductPrice;
                metal: any;
                category: any;
                subcategory: any;
                priceRule: any;
                createdAt: any;
                updatedAt: any;
            }[];
        };
    }>;
    getUserCategories(metalId?: string): Promise<any>;
    getProductBySlug(slug: string): Promise<{
        status: string;
        data: {
            product: any;
        };
    }>;
    getRelatedProducts(ids?: string): Promise<{
        status: string;
        data: {
            products: {
                _id: any;
                id: any;
                name: any;
                title: any;
                slug: any;
                sku: any;
                description: any;
                image: any;
                mainImage: any;
                images: any;
                tags: any;
                tag: any;
                weight: number;
                weightGrams: number;
                grossWeight: number;
                netGoldWeight: number;
                stoneWeight: number;
                purity: any;
                wastagePercent: number;
                bisHallmark: any;
                stock: any;
                stockQuantity: any;
                isActive: any;
                isPublished: any;
                isFeatured: any;
                isPriceFixed: any;
                actualPrice: number;
                discountedPrice: number;
                festivalIds: any;
                relationIds: any;
                collectionIds: any;
                attributes: any;
                sizes: any;
                specifications: any;
                metalId: any;
                categoryId: any;
                subcategoryId: any;
                priceRuleId: any;
                calculatedPrice: import("./products.service").CalculatedProductPrice;
                metal: any;
                category: any;
                subcategory: any;
                priceRule: any;
                createdAt: any;
                updatedAt: any;
            }[];
        };
    }>;
    getProductsByCategorySlug(slug: string, query: any): Promise<any>;
    getInstagramVideos(pageStr?: string, limitStr?: string): Promise<{
        status: string;
        data: {
            videos: {
                _id: string;
                caption: string;
                instagramLink: string;
                videoUrl: string;
                thumbnail: string;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
                hasNext: boolean;
                hasPrev: boolean;
            };
        };
    }>;
}
