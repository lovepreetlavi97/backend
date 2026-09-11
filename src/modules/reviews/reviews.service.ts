import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) { }

  async getTopReviews() {
    return this.prisma.review.findMany({
      where: { rating: { gte: 4 } },
      include: {
        user: { select: { id: true, name: true } },
        product: { select: { id: true, title: true, slug: true, images: true } },
      },
      orderBy: [
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 20,
    });
  }

  async getProductReviews(productId: string) {
    return this.prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addReview(userId: string, productId: string, rating: number, comment?: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.isDeleted) {
      throw new NotFoundException('Product not found.');
    }

    return this.prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        comment,
      },
    });
  }
}
