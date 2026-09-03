import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateOrderDto {
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  items?: Array<{ productId?: string; id?: string; _id?: string; quantity?: number }>;
  products?: Array<{ productId?: string; id?: string; _id?: string; quantity?: number }>;
  shippingAddress: any;
  billingAddress?: any;
  paymentMethod?: string;
  paymentStatus?: string;
  totalAmount?: number;
  finalAmount?: number;
  shippingCharge?: number;
  discountAmount?: number;
  taxAmount?: number;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrder(dto: CreateOrderDto) {
    const rawItems = dto.items || dto.products || [];
    const normalizedItems = rawItems
      .map((i: any) => ({
        productId: (i.productId || i.id || i._id || '').trim(),
        quantity: Math.max(1, Number(i.quantity) || 1),
      }))
      .filter((i) => i.productId.length > 0);

    if (normalizedItems.length === 0) {
      throw new BadRequestException('Order items cannot be empty.');
    }

    const productIds = normalizedItems.map((i) => i.productId);

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

    for (const item of normalizedItems) {
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
      for (const item of normalizedItems) {
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

      return {
        ...order,
        _id: order.id,
      };
    });
  }

  private mapOrder(order: any) {
    const rawItems = Array.isArray(order.items) ? order.items : [];
    const mappedProducts = rawItems.map((item: any, idx: number) => ({
      _id: item.productId || item.id || `item-${idx}`,
      productId: item.productId || item.id || '',
      name: item.title || item.name || 'Jewellery Product',
      price: Number(item.unitPrice || item.price || 0),
      quantity: Number(item.quantity || 1),
      subtotal: Number(item.itemTotal || (item.unitPrice ? item.unitPrice * item.quantity : 0)),
      status: order.orderStatus,
      image: item.image || '',
    }));

    const total = Number(order.totalAmount || order.finalAmount || 0);
    const finalAmt = Number(order.finalAmount || order.totalAmount || 0);

    return {
      _id: order.id,
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.user
        ? {
            _id: order.user.id,
            id: order.user.id,
            name: order.user.name,
            email: order.user.email,
            phone: order.user.phone || '',
          }
        : {
            _id: order.userId || 'guest',
            name: order.guestName || 'Guest Customer',
            email: order.guestEmail || 'guest@gurujewellers.com',
            phone: order.guestPhone || '',
          },
      products: mappedProducts,
      subtotal: total,
      shippingCharge: 0,
      tax: 0,
      taxAmount: 0,
      totalAmount: total,
      discountAmount: Number(order.discountAmount || 0),
      finalAmount: finalAmt,
      status: order.orderStatus,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: 'Online / Razorpay',
      shippingAddress: typeof order.shippingAddress === 'string'
        ? JSON.parse(order.shippingAddress)
        : order.shippingAddress || {},
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  async findAllOrders(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    paymentStatus?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Math.max(1, Number(params?.page || 1));
    const limit = Math.max(1, Number(params?.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params?.status && params.status !== 'all') {
      where.orderStatus = params.status.toUpperCase() as any;
    }

    if (params?.paymentStatus && params.paymentStatus !== 'all') {
      where.paymentStatus = params.paymentStatus.toUpperCase() as any;
    }

    if (params?.customerId) {
      where.userId = params.customerId;
    }

    if (params?.startDate || params?.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
    }

    if (params?.search && params.search.trim()) {
      const s = params.search.trim();
      where.OR = [
        { orderNumber: { contains: s, mode: 'insensitive' } },
        { guestName: { contains: s, mode: 'insensitive' } },
        { guestEmail: { contains: s, mode: 'insensitive' } },
        { guestPhone: { contains: s, mode: 'insensitive' } },
      ];
    }

    const orderByField = params?.sortBy || 'createdAt';
    const orderDirection = params?.sortOrder || 'desc';

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { user: true },
        orderBy: [{ [orderByField]: orderDirection }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((o) => this.mapOrder(o)),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { user: true, vendorOrders: true, transactions: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${id}' not found.`);
    }

    return this.mapOrder(order);
  }

  async updateOrderStatus(id: string, status: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Order not found`);

    const updated = await this.prisma.order.update({
      where: { id },
      data: { orderStatus: status.toUpperCase() as any },
      include: { user: true },
    });

    return this.mapOrder(updated);
  }

  async updatePaymentStatus(id: string, paymentStatus: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Order not found`);

    const updated = await this.prisma.order.update({
      where: { id },
      data: { paymentStatus: paymentStatus.toUpperCase() as any },
      include: { user: true },
    });

    return this.mapOrder(updated);
  }

  async deleteOrder(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Order not found`);

    await this.prisma.order.update({
      where: { id },
      data: { orderStatus: 'CANCELLED' as any },
    });

    return { success: true };
  }

  async getRefunds(params?: any) {
    return this.findAllOrders({ ...params, status: 'CANCELLED' });
  }

  async getUserOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.mapOrder(o));
  }

  async getOrderByNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { user: true },
    });
    if (!order) {
      throw new NotFoundException(`Order '${orderNumber}' not found.`);
    }
    return this.mapOrder(order);
  }
}
