import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(public readonly prisma: PrismaService) {}

  async getUserWishlist(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: { metal: true, priceRule: true },
        },
      },
    });
  }

  async toggleWishlist(userId: string, productId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      await this.prisma.wishlist.delete({ where: { id: existing.id } });
      return { added: false, message: 'Removed from wishlist' };
    }

    try {
      const item = await this.prisma.wishlist.create({
        data: { userId, productId },
      });
      return { added: true, message: 'Added to wishlist', item };
    } catch {
      return { added: true, message: 'Already in wishlist' };
    }
  }
}
