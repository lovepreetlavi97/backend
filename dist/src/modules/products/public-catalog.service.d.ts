import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';
import { RedisService } from '../../shared/redis/redis.service';
export declare class PublicCatalogService {
    private readonly prisma;
    private readonly productsService;
    private readonly redis;
    constructor(prisma: PrismaService, productsService: ProductsService, redis: RedisService);
    mapProduct(product: any): {
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
    };
    getFeaturedSubcategories(defaultImage: string, defaultDesc: string): Promise<{
        _id: string;
        name: string;
        slug: string;
        image: string;
        mainImage: string;
        description: string;
    }[]>;
    getHomepage(): Promise<any>;
    getCategoryMenu(): Promise<any>;
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
    getTrendingProducts(metalParam?: string): Promise<{
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
    getProductsByCategorySlug(slug: string, page: number, limit: number): Promise<{
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
}
