import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    getReviews(productId: string): Promise<{
        status: string;
        data: {
            reviews: ({
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
            })[];
        };
    }>;
    addReview(userId: string, dto: {
        productId: string;
        rating: number;
        comment?: string;
    }): Promise<{
        status: string;
        message: string;
        data: {
            review: {
                id: string;
                createdAt: Date;
                userId: string;
                productId: string;
                rating: number;
                comment: string | null;
            };
        };
    }>;
}
