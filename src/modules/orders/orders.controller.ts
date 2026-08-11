import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService, CreateOrderDto } from './orders.service';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Orders')
@Controller('order')
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
}
