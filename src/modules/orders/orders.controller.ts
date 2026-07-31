import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { OrdersService, CreateOrderDto } from './orders.service';

@Controller('order')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Body() dto: CreateOrderDto) {
    const order = await this.ordersService.createOrder(dto);
    return {
      status: 'success',
      message: 'Order created successfully.',
      data: { order },
    };
  }

  @Get('user/:userId')
  async getUserOrders(@Param('userId') userId: string) {
    const orders = await this.ordersService.getUserOrders(userId);
    return {
      status: 'success',
      data: { orders },
    };
  }
}
