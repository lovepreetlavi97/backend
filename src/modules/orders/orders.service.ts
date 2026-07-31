import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateOrderDto {
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
  shippingAddress: any;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order items cannot be empty.');
    }

    const productIds = dto.items.map((i) => i.productId);

    // Batch query to eliminate N+1 problem
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { metal: true, priceRule: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    let calculatedTotalPaise = 0;
    const validatedItems = [];

    for (const item of dto.items) {
      const product = productMap.get(item.productId);

      if (!product || product.isDeleted || !product.isPublished) {
        throw new NotFoundException(`Product ID '${item.productId}' not available.`);
      }

      const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 6500;
      const makingCharge = product.priceRule ? Number(product.priceRule.makingChargeGram) : 450;
      const gstPercent = product.priceRule ? Number(product.priceRule.gstPercentage) : 3.0;

      const rawPrice = Number(product.weightGrams) * ratePerGram + Number(product.weightGrams) * makingCharge;
      const unitPrice = rawPrice * (1 + gstPercent / 100);
      const unitPricePaise = Math.round(unitPrice * 100);
      const itemTotalPaise = unitPricePaise * item.quantity;

      calculatedTotalPaise += itemTotalPaise;

      validatedItems.push({
        productId: product.id,
        title: product.title,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice: unitPricePaise / 100,
        itemTotal: itemTotalPaise / 100,
      });
    }

    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const orderNumber = `MYG-${Date.now()}-${randomSuffix}`;
    const finalAmount = calculatedTotalPaise / 100;

    // Atomic transaction block preventing race conditions & negative stock
    return this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        const currentProduct = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!currentProduct || currentProduct.stockQuantity < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for '${currentProduct?.title || item.productId}'. Stock available: ${currentProduct?.stockQuantity || 0}, requested: ${item.quantity}`,
          );
        }

        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: dto.userId,
          totalAmount: finalAmount,
          finalAmount: finalAmount,
          items: validatedItems,
          shippingAddress: dto.shippingAddress,
          orderStatus: 'PENDING',
          paymentStatus: 'PENDING',
        },
      });

      return order;
    });
  }

  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
