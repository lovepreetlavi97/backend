import { PrismaService } from '../prisma/prisma.service';
export declare class ReviewsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getProductReviews(productId: string): Promise<({
        user: {
            id: string;
            name: string;
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
