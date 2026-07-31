import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminAnalytics() {
    const totalUsers = await this.prisma.user.count({ where: { isDeleted: false } });
    const totalOrders = await this.prisma.order.count();
    const totalProducts = await this.prisma.product.count({ where: { isDeleted: false } });
    const activeKitties = await this.prisma.userKitty.count({ where: { status: 'ACTIVE' } });

    const totalRevenueResult = await this.prisma.order.aggregate({
      _sum: { finalAmount: true },
      where: { paymentStatus: 'PAID' },
    });

    const recentOrders = await this.prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return {
      totalUsers,
      totalOrders,
      totalProducts,
      activeKitties,
      totalRevenue: Number(totalRevenueResult._sum.finalAmount || 0),
      recentOrders,
    };
  }
}
