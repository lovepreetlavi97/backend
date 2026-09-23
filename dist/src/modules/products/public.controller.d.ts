import { ProductsService } from './products.service';
import { PublicCatalogService } from './public-catalog.service';
import { FilterConfigService } from '../settings/filter-config.service';
export declare class PublicController {
    private readonly productsService;
    private readonly publicCatalogService;
    private readonly filterConfigService;
    constructor(productsService: ProductsService, publicCatalogService: PublicCatalogService, filterConfigService: FilterConfigService);
    getHomepage(): Promise<any>;
    getCategoryMenu(): Promise<any>;
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
    getEssentials(): Promise<{
        status: string;
        data: {
            products: {
                _id: any;
                name: any;
                slug: any;
                description: any;
                mainImage: any;
                images: any;
                weightGrams: any;
                stock: any;
                isActive: any;
                isPublished: any;
                metalId: any;
                categoryId: any;
                subcategoryId: any;
                priceRuleId: any;
                calculatedPrice: import("./products.service").CalculatedProductPrice;
                metal: any;
                category: any;
                subcategory: any;
                priceRule: any;
            }[];
        };
    }>;
    getTrendingProducts(metalId?: string): Promise<{
        status: string;
        data: {
            products: {
                _id: any;
                name: any;
                slug: any;
                description: any;
                mainImage: any;
                images: any;
                weightGrams: any;
                stock: any;
                isActive: any;
                isPublished: any;
                metalId: any;
                categoryId: any;
                subcategoryId: any;
                priceRuleId: any;
                calculatedPrice: import("./products.service").CalculatedProductPrice;
                metal: any;
                category: any;
                subcategory: any;
                priceRule: any;
            }[];
        };
    }>;
    getCuratedCollections(): Promise<{
        status: string;
        data: {
            curatedCollections: {
                _id: string;
                name: string;
                slug: string;
                image: string;
                description: string;
            }[];
        };
    }>;
    getFestivals(): Promise<{
        status: string;
        data: {
            festivals: {
                _id: string;
                name: string;
                slug: string;
                mainImage: string;
                description: string;
            }[];
        };
    }>;
    getHomeSearch(queryStr?: string): Promise<{
        status: string;
        data: {
            subcategories: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isDeleted: boolean;
                slug: string;
                image: string | null;
                description: string | null;
                categoryId: string;
            }[];
            products: {
                _id: any;
                name: any;
                slug: any;
                description: any;
                mainImage: any;
                images: any;
                weightGrams: any;
                stock: any;
                isActive: any;
                isPublished: any;
                metalId: any;
                categoryId: any;
                subcategoryId: any;
                priceRuleId: any;
                calculatedPrice: import("./products.service").CalculatedProductPrice;
                metal: any;
                category: any;
                subcategory: any;
                priceRule: any;
            }[];
        };
    }>;
    getUserCategories(): Promise<{
        status: string;
        data: {
            categories: ({
                subcategories: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isDeleted: boolean;
                    slug: string;
                    image: string | null;
                    description: string | null;
                    categoryId: string;
                }[];
            } & {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                isDeleted: boolean;
                slug: string;
                image: string | null;
                description: string | null;
                isFeatured: boolean;
            })[];
        };
    }>;
    getProductBySlug(slug: string): Promise<{
        status: string;
        data: {
            product: {
                calculatedPrice: import("./products.service").CalculatedProductPrice;
                reviews: {
                    id: string;
                    createdAt: Date;
                    userId: string;
                    productId: string;
                    rating: number;
                    comment: string | null;
                }[];
                metal: {
                    id: string;
                    name: string;
                    isActive: boolean;
                    updatedAt: Date;
                    slug: string;
                    colorCode: string | null;
                    gradient: string | null;
                    type: import(".prisma/client").$Enums.MetalType;
                    ratePerGram: import("@prisma/client/runtime/library").Decimal;
                    purity: string;
                };
                priceRule: {
                    id: string;
                    name: string;
                    updatedAt: Date;
                    makingChargeGram: import("@prisma/client/runtime/library").Decimal;
                    gstPercentage: import("@prisma/client/runtime/library").Decimal;
                    discountPercent: import("@prisma/client/runtime/library").Decimal;
                };
                category: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isDeleted: boolean;
                    slug: string;
                    image: string | null;
                    description: string | null;
                    isFeatured: boolean;
                };
                subcategory: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    isDeleted: boolean;
                    slug: string;
                    image: string | null;
                    description: string | null;
                    categoryId: string;
                };
                id: string;
                createdAt: Date;
                updatedAt: Date;
                isDeleted: boolean;
                slug: string;
                description: string;
                isFeatured: boolean;
                images: string[];
                categoryId: string | null;
                sku: string;
                title: string;
                weightGrams: import("@prisma/client/runtime/library").Decimal;
                stockQuantity: number;
                isPublished: boolean;
                vendorId: string | null;
                approvalStatus: import(".prisma/client").$Enums.ProductApprovalStatus;
                rejectionReason: string | null;
                subcategoryId: string | null;
                metalId: string | null;
                priceRuleId: string | null;
            };
        };
    }>;
    getProductsByCategorySlug(slug: string, pageStr?: string, limitStr?: string): Promise<{
        status: string;
        data: {
            products: {
                _id: any;
                name: any;
                slug: any;
                description: any;
                mainImage: any;
                images: any;
                weightGrams: any;
                stock: any;
                isActive: any;
                isPublished: any;
                metalId: any;
                categoryId: any;
                subcategoryId: any;
                priceRuleId: any;
                calculatedPrice: import("./products.service").CalculatedProductPrice;
                metal: any;
                category: any;
                subcategory: any;
                priceRule: any;
            }[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                totalPages: number;
                hasMore: boolean;
            };
            hasMore: boolean;
        };
    }>;
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
