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
    const existing = await this.prisma.wishlist.findFirst({
      where: { userId, productId },
    });

    if (existing) {
      await this.prisma.wishlist.delete({ where: { id: existing.id } });
      return { added: false, message: 'Removed from wishlist' };
    }

    const item = await this.prisma.wishlist.create({
      data: { userId, productId },
    });

    return { added: true, message: 'Added to wishlist', item };
  }
}
