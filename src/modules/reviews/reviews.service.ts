import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) { }

  async getAllReviews(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        include: {
          user: { select: { id: true, name: true } },
          product: { select: { id: true, title: true, slug: true, images: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count(),
    ]);

    const mapped = reviews.map((r) => ({
      _id: r.id,
      id: r.id,
      rating: r.rating,
      comment: r.comment || '',
      reviewText: r.comment || '',
      user: {
        _id: r.user?.id || r.userId,
        id: r.user?.id || r.userId,
        name: r.user?.name || 'Verified Customer',
      },
      product: r.product
        ? {
            _id: r.product.id,
            id: r.product.id,
            title: r.product.title,
            slug: r.product.slug,
            image: Array.isArray(r.product.images) ? r.product.images[0] || '' : '',
          }
        : null,
      createdAt: r.createdAt.toISOString(),
    }));

    return {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
      reviews: mapped,
    };
  }

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
