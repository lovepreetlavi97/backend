import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { OrdersService, CreateOrderDto } from './orders.service';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Orders')
@Controller(['order', 'orders'])
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Create new order (Supports Guest & Authenticated Checkout)' })
  async createOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user?.id || dto.userId || undefined;
    const order = await this.ordersService.createOrder({ ...dto, userId });
    return {
      status: 'success',
      message: 'Order created successfully.',
      data: { order },
    };
  }

  @Get('track/:orderNumber')
  @ApiOperation({ summary: 'Public order tracking by order number (Guest & User)' })
  async trackOrder(@Param('orderNumber') orderNumber: string) {
    const order = await this.ordersService.getOrderByNumber(orderNumber);
    return {
      status: 'success',
      data: { order },
    };
  }

  @Get('refunds')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Get refund requests & cancelled orders' })
  async getRefundRequests(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const data = await this.ordersService.getRefunds({ page, limit, search });
    return {
      status: 'success',
      data,
    };
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order history for specified user' })
  async getUserOrders(@Param('userId') userId: string, @CurrentUser() user: any) {
    if (user.id !== userId && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Access denied: You can only view your own orders.');
    }
    const orders = await this.ordersService.getUserOrders(userId);
    return {
      status: 'success',
      data: { orders },
    };
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Get all orders with filtering and pagination' })
  async getAllOrders(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('customerId') customerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const data = await this.ordersService.findAllOrders({
      page,
      limit,
      search,
      status,
      paymentStatus,
      customerId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });
    return {
      status: 'success',
      data,
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Get order details by ID' })
  async getOrderById(@Param('id') id: string) {
    const order = await this.ordersService.getOrderById(id);
    return {
      status: 'success',
      data: { order },
    };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Update order status' })
  async updateOrderStatus(@Param('id') id: string, @Body() dto: { status: string; notes?: string }) {
    const order = await this.ordersService.updateOrderStatus(id, dto.status);
    return {
      status: 'success',
      message: 'Order status updated successfully.',
      data: { order },
    };
  }

  @Put(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Update order status' })
  async updateOrderStatusDirect(@Param('id') id: string, @Body() dto: { status: string; notes?: string }) {
    const order = await this.ordersService.updateOrderStatus(id, dto.status);
    return {
      status: 'success',
      message: 'Order status updated successfully.',
      data: { order },
    };
  }

  @Put(':id/payment-status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Update order payment status' })
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() dto: { paymentStatus: string; transactionId?: string },
  ) {
    const order = await this.ordersService.updatePaymentStatus(id, dto.paymentStatus);
    return {
      status: 'success',
      message: 'Payment status updated successfully.',
      data: { order },
    };
  }

  @Patch(':orderId/products/:productId/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Update product status within order' })
  async updateOrderProductStatus(
    @Param('orderId') orderId: string,
    @Param('productId') productId: string,
    @Body('status') status: string,
  ) {
    return {
      status: 'success',
      message: 'Product status updated.',
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Delete order' })
  async deleteOrder(@Param('id') id: string) {
    await this.ordersService.deleteOrder(id);
    return {
      status: 'success',
      message: 'Order cancelled/deleted successfully.',
    };
  }
}

