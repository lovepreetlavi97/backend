import { ReviewsService } from './reviews.service';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    getAllReviews(page?: string, limit?: string): Promise<{
        status: string;
        data: {
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
        };
    }>;
    getTopReviews(): Promise<{
        status: string;
        data: {
            reviews: ({
                user: {
                    id: string;
                    name: string;
                };
                product: {
                    id: string;
                    title: string;
                    slug: string;
                    images: string[];
                };
            } & {
                id: string;
                userId: string;
                createdAt: Date;
                productId: string;
                rating: number;
                comment: string | null;
            })[];
        };
    }>;
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
                userId: string;
                createdAt: Date;
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
                userId: string;
                createdAt: Date;
                productId: string;
                rating: number;
                comment: string | null;
            };
        };
    }>;
}
