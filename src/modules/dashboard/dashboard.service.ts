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

  async getCounts() {
    const users = await this.prisma.user.count({ where: { isDeleted: false } });
    const categories = await this.prisma.category.count({ where: { isDeleted: false } });
    const subcategories = await this.prisma.subCategory.count({ where: { isDeleted: false } });
    const relations = 5; // static count matching frontend/public list
    const products = await this.prisma.product.count({ where: { isDeleted: false } });
    const festivals = 3; // static count matching frontend/public list
    const orders = await this.prisma.order.count();
    const refunds = await this.prisma.order.count({
      where: {
        OR: [
          { orderStatus: 'CANCELLED' },
          { paymentStatus: 'REFUNDED' }
        ]
      }
    });

    const totalRevenueResult = await this.prisma.order.aggregate({
      _sum: { finalAmount: true },
      where: { paymentStatus: 'PAID' },
    });
    const revenue = Number(totalRevenueResult._sum.finalAmount || 0);

    const carts = await this.prisma.cart.count();
    const contactQueries = await this.prisma.contact.count();
    const wishlistItems = await this.prisma.wishlist.count();

    return {
      users,
      categories,
      subcategories,
      relations,
      products,
      festivals,
      orders,
      refunds,
      revenue,
      carts,
      contactQueries,
      wishlistItems,
    };
  }

  async getPerformance() {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    // Fetch all orders of current year
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
      },
      select: {
        createdAt: true,
        finalAmount: true,
        paymentStatus: true,
      },
    });

    // Fetch all users of current year
    const users = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: startOfYear,
          lte: endOfYear,
        },
        isDeleted: false,
      },
      select: {
        createdAt: true,
      },
    });

    const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = monthsNames.map((month, index) => {
      const monthOrders = orders.filter(o => o.createdAt.getMonth() === index);
      const paidOrders = monthOrders.filter(o => o.paymentStatus === 'PAID');
      const revenue = paidOrders.reduce((sum, o) => sum + Number(o.finalAmount || 0), 0);

      const monthUsers = users.filter(u => u.createdAt.getMonth() === index);

      return {
        month,
        orders: monthOrders.length,
        users: monthUsers.length,
        revenue,
      };
    });

    return {
      year: currentYear,
      months: monthlyData,
    };
  }
}
