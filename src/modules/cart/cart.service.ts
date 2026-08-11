import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(public readonly prisma: PrismaService) {}

  async getCart(userId?: string, guestId?: string) {
    if (!userId && !guestId) return [];

    const items = await this.prisma.cart.findMany({
      where: userId ? { userId } : { guestId },
      include: {
        product: {
          include: { metal: true, priceRule: true },
        },
      },
    });

    return items;
  }

  async getUserCart(userId: string) {
    return this.getCart(userId, undefined);
  }

  async addToCart(userId: string | null, guestId: string | null, productId: string, quantity: number = 1) {
    if (!userId && !guestId) {
      throw new NotFoundException('Either userId or guestId is required.');
    }

    const existing = await this.prisma.cart.findFirst({
      where: userId ? { userId, productId } : { guestId: guestId!, productId },
    });

    if (existing) {
      return this.prisma.cart.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    }

    return this.prisma.cart.create({
      data: {
        userId: userId || undefined,
        guestId: guestId || undefined,
        productId,
        quantity,
      },
    });
  }

  async removeFromCart(cartItemId: string, userId?: string, guestId?: string) {
    const item = await this.prisma.cart.findUnique({ where: { id: cartItemId } });
    if (!item) {
      throw new NotFoundException('Cart item not found.');
    }

    if (userId && item.userId !== userId) {
      throw new NotFoundException('Cart item not found.');
    }
    if (!userId && guestId && item.guestId !== guestId) {
      throw new NotFoundException('Cart item not found.');
    }

    return this.prisma.cart.delete({ where: { id: cartItemId } });
  }

  async syncGuestCartToUser(guestId: string, userId: string) {
    if (!guestId || !userId) return;

    const guestItems = await this.prisma.cart.findMany({
      where: { guestId },
    });

    for (const item of guestItems) {
      const userItem = await this.prisma.cart.findFirst({
        where: { userId, productId: item.productId },
      });

      if (userItem) {
        await this.prisma.cart.update({
          where: { id: userItem.id },
          data: { quantity: userItem.quantity + item.quantity },
        });
        await this.prisma.cart.delete({ where: { id: item.id } }).catch(() => null);
      } else {
        await this.prisma.cart.update({
          where: { id: item.id },
          data: { userId, guestId: null },
        });
      }
    }
  }
}
