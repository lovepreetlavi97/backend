import { Controller, Post, Get, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService, CreateOrderDto } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('order')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new e-commerce order' })
  async createOrder(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    const userId = user?.id || dto.userId;
    const order = await this.ordersService.createOrder({ ...dto, userId });
    return {
      status: 'success',
      message: 'Order created successfully.',
      data: { order },
    };
  }

  @Get('user/:userId')
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
}
