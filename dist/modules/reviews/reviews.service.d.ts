import { PrismaService } from '../prisma/prisma.service';
export declare class ReviewsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAllReviews(page?: number, limit?: number): Promise<{
        total: number;
        page: number;
        limit: number;
        pages: number;
        reviews: {
            _id: string;
            id: string;
            rating: number;
            comment: string;
            reviewText: string;
            user: {
                _id: string;
                id: string;
                name: string;
            };
            product: {
                _id: string;
                id: string;
                title: string;
                slug: string;
                image: string;
            };
            createdAt: string;
        }[];
    }>;
    getTopReviews(): Promise<({
        user: {
            name: string;
            id: string;
        };
        product: {
            id: string;
            slug: string;
            title: string;
            images: string[];
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        productId: string;
        rating: number;
        comment: string | null;
    })[]>;
    getProductReviews(productId: string): Promise<({
        user: {
            name: string;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        productId: string;
        rating: number;
        comment: string | null;
    })[]>;
    addReview(userId: string, productId: string, rating: number, comment?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        productId: string;
        rating: number;
        comment: string | null;
    }>;
}
