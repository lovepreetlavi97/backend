import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(public readonly prisma: PrismaService) {}

  async getUserCart(userId: string) {
    const items = await this.prisma.cart.findMany({
      where: { userId },
      include: {
        product: {
          include: { metal: true, priceRule: true },
        },
      },
    });

    return items;
  }

  async addToCart(userId: string, productId: string, quantity: number = 1) {
    const existing = await this.prisma.cart.findFirst({
      where: { userId, productId },
    });

    if (existing) {
      return this.prisma.cart.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    }

    return this.prisma.cart.create({
      data: { userId, productId, quantity },
    });
  }

  async removeFromCart(userId: string, cartItemId: string) {
    const item = await this.prisma.cart.findUnique({ where: { id: cartItemId } });
    if (!item || item.userId !== userId) {
      throw new NotFoundException('Cart item not found.');
    }

    return this.prisma.cart.delete({ where: { id: cartItemId } });
  }
}
