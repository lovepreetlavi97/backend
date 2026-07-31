import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

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

    let calculatedTotal = 0;
    const validatedItems = [];

    // Validate stock and compute item totals atomically
    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        include: { metal: true, priceRule: true },
      });

      if (!product || product.isDeleted || !product.isPublished) {
        throw new NotFoundException(`Product ID '${item.productId}' not available.`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(`Insufficient stock for '${product.title}'. Requested: ${item.quantity}, Stock: ${product.stockQuantity}`);
      }

      const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 6500;
      const makingCharge = product.priceRule ? Number(product.priceRule.makingChargeGram) : 450;
      const gstPercent = product.priceRule ? Number(product.priceRule.gstPercentage) : 3.0;
      
      const rawPrice = Number(product.weightGrams) * ratePerGram + Number(product.weightGrams) * makingCharge;
      const unitPrice = rawPrice * (1 + gstPercent / 100);
      const itemTotal = unitPrice * item.quantity;

      calculatedTotal += itemTotal;

      validatedItems.push({
        productId: product.id,
        title: product.title,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice: Math.round(unitPrice * 100) / 100,
        itemTotal: Math.round(itemTotal * 100) / 100,
      });
    }

    const orderNumber = `MYG-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return this.prisma.$transaction(async (tx) => {
      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: dto.userId,
          totalAmount: Math.round(calculatedTotal * 100) / 100,
          finalAmount: Math.round(calculatedTotal * 100) / 100,
          items: validatedItems,
          shippingAddress: dto.shippingAddress,
          orderStatus: 'PENDING',
          paymentStatus: 'PENDING',
        },
      });

      // Decrement product stock
      for (const item of dto.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

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
