import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin - Returns & Refunds')
@Controller('returns')
export class ReturnsController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Get all returns and refunds' })
  async getAllReturns(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const ordersRes = await this.ordersService.findAllOrders({
      page,
      limit,
      search,
      status: 'CANCELLED',
    });

    const mappedReturns = ordersRes.orders.map((o: any) => ({
      _id: o._id,
      id: o._id,
      orderId: {
        _id: o._id,
        orderNumber: o.orderNumber,
      },
      userId: {
        _id: o.userId?._id || 'guest',
        name: o.userId?.name || 'Customer',
        email: o.userId?.email || 'customer@example.com',
      },
      products: o.products.map((p: any) => ({
        productId: {
          _id: p.productId,
          name: p.name,
          image: p.image || '',
        },
        quantity: p.quantity,
        price: p.price,
        reason: 'Customer requested return/refund',
      })),
      returnReason: 'Cancelled / Return request',
      returnStatus: 'completed',
      refundAmount: o.finalAmount || o.totalAmount,
      refundStatus: o.paymentStatus === 'REFUNDED' ? 'processed' : 'pending',
      refundMethod: 'original_payment',
      trackingNumber: '',
      adminNotes: 'Processed via admin panel',
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));

    return {
      status: 'success',
      data: {
        returns: mappedReturns,
        pagination: ordersRes.pagination,
      },
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Get return details by ID' })
  async getReturnById(@Param('id') id: string) {
    const o = await this.ordersService.getOrderById(id);
    const returnObj = {
      _id: o._id,
      id: o._id,
      orderId: {
        _id: o._id,
        orderNumber: o.orderNumber,
      },
      userId: {
        _id: o.userId?._id || 'guest',
        name: o.userId?.name || 'Customer',
        email: o.userId?.email || 'customer@example.com',
      },
      products: o.products.map((p: any) => ({
        productId: {
          _id: p.productId,
          name: p.name,
          image: p.image || '',
        },
        quantity: p.quantity,
        price: p.price,
        reason: 'Customer requested return',
      })),
      returnReason: 'Return request',
      returnStatus: 'completed',
      refundAmount: o.finalAmount || o.totalAmount,
      refundStatus: o.paymentStatus === 'REFUNDED' ? 'processed' : 'pending',
      refundMethod: 'original_payment',
      trackingNumber: '',
      adminNotes: '',
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };

    return {
      status: 'success',
      data: { return: returnObj },
    };
  }

  @Post(':id/refund')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Process refund' })
  async processRefund(@Param('id') id: string) {
    await this.ordersService.updatePaymentStatus(id, 'REFUNDED');
    return {
      status: 'success',
      message: 'Refund processed successfully.',
    };
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Update return status' })
  async updateReturnStatus(@Param('id') id: string, @Body('status') status: string) {
    await this.ordersService.updateOrderStatus(id, status || 'CANCELLED');
    return {
      status: 'success',
      message: 'Status updated.',
    };
  }
}
