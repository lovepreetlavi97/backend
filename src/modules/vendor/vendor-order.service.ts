import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateShipmentDto } from './dto/vendor.dto';

@Injectable()
export class VendorOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async getVendorOrders(
    vendorId: string,
    page: number = 1,
    limit: number = 20,
    status?: string,
  ) {
    const skip = (page - 1) * limit;

    const [vendorOrders, total] = await Promise.all([
      this.prisma.vendorOrder.findMany({
        where: {
          vendorId,
          orderStatus: status ? (status as any) : undefined,
        },
        include: {
          order: {
            select: {
              orderNumber: true,
              shippingAddress: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.vendorOrder.count({
        where: {
          vendorId,
          orderStatus: status ? (status as any) : undefined,
        },
      }),
    ]);

    return {
      vendorOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getVendorOrderById(vendorId: string, vendorOrderId: string) {
    const vendorOrder = await this.prisma.vendorOrder.findUnique({
      where: { id: vendorOrderId },
      include: {
        order: {
          select: {
            orderNumber: true,
            shippingAddress: true,
            createdAt: true,
          },
        },
      },
    });

    if (!vendorOrder) {
      throw new NotFoundException('Vendor order not found.');
    }

    if (vendorOrder.vendorId !== vendorId) {
      throw new ForbiddenException('Access denied: You do not own this order.');
    }

    return vendorOrder;
  }

  async updateVendorOrderStatus(
    vendorId: string,
    vendorOrderId: string,
    status: string,
  ) {
    const vendorOrder = await this.prisma.vendorOrder.findUnique({
      where: { id: vendorOrderId },
    });

    if (!vendorOrder) {
      throw new NotFoundException('Vendor order not found.');
    }

    if (vendorOrder.vendorId !== vendorId) {
      throw new ForbiddenException('Access denied: You do not own this order.');
    }

    return this.prisma.vendorOrder.update({
      where: { id: vendorOrderId },
      data: { orderStatus: status as any },
    });
  }

  async updateTrackingInfo(
    vendorId: string,
    vendorOrderId: string,
    dto: UpdateShipmentDto,
  ) {
    const vendorOrder = await this.prisma.vendorOrder.findUnique({
      where: { id: vendorOrderId },
    });

    if (!vendorOrder) {
      throw new NotFoundException('Vendor order not found.');
    }

    if (vendorOrder.vendorId !== vendorId) {
      throw new ForbiddenException('Access denied: You do not own this order.');
    }

    return this.prisma.vendorOrder.update({
      where: { id: vendorOrderId },
      data: {
        trackingNumber: dto.trackingNumber,
        carrier: dto.carrier,
        orderStatus: 'SHIPPED',
      },
    });
  }
}
