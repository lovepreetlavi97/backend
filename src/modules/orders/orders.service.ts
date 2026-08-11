import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateOrderDto {
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
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
    // Map to group line items per vendor for internal multi-vendor sub-orders
    const vendorItemsMap = new Map<string, Array<any>>();

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

      const itemDetail = {
        productId: product.id,
        title: product.title,
        sku: product.sku,
        quantity: item.quantity,
        unitPrice: unitPricePaise / 100,
        itemTotal: itemTotalPaise / 100,
        vendorId: product.vendorId || null,
      };

      validatedItems.push(itemDetail);

      if (product.vendorId) {
        if (!vendorItemsMap.has(product.vendorId)) {
          vendorItemsMap.set(product.vendorId, []);
        }
        vendorItemsMap.get(product.vendorId)!.push(itemDetail);
      }
    }

    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const orderNumber = `MYG-${Date.now()}-${randomSuffix}`;
    const finalAmount = calculatedTotalPaise / 100;

    // Atomic transaction block preventing race conditions & negative stock
    return this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        const updateResult = await tx.product.updateMany({
          where: {
            id: item.productId,
            stockQuantity: { gte: item.quantity },
          },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });

        if (updateResult.count === 0) {
          const currentProduct = await tx.product.findUnique({ where: { id: item.productId } });
          throw new BadRequestException(
            `Insufficient stock for '${currentProduct?.title || item.productId}'. Stock available: ${currentProduct?.stockQuantity || 0}, requested: ${item.quantity}`,
          );
        }
      }

      // Create Parent Order (Visible to customer)
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: dto.userId || null,
          guestName: dto.guestName || null,
          guestEmail: dto.guestEmail || null,
          guestPhone: dto.guestPhone || null,
          totalAmount: finalAmount,
          finalAmount: finalAmount,
          items: validatedItems,
          shippingAddress: dto.shippingAddress,
          orderStatus: 'PENDING',
          paymentStatus: 'PENDING',
        },
      });

      // Generate internal Multi-Vendor Sub-Orders (VendorOrder) for each distinct vendor
      let vCounter = 1;
      for (const [vendorId, vItems] of vendorItemsMap.entries()) {
        const vTotal = vItems.reduce((acc, curr) => acc + curr.itemTotal, 0);
        await tx.vendorOrder.create({
          data: {
            orderId: order.id,
            vendorId,
            vendorOrderNumber: `${orderNumber}-V${vCounter++}`,
            orderStatus: 'PENDING',
            items: vItems,
            totalAmount: vTotal,
          },
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

  async getOrderByNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
    });
    if (!order) {
      throw new NotFoundException(`Order '${orderNumber}' not found.`);
    }
    return order;
  }
}
