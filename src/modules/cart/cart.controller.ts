import { Controller, Get, Post, Delete, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get current user cart items' })
  async getUserCart(@Param('userId') userId: string, @CurrentUser() user: any) {
    if (user.id !== userId && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Access denied: You can only view your own cart.');
    }
    const items = await this.cartService.getUserCart(userId);
    return {
      status: 'success',
      data: { items },
    };
  }

  @Post()
  @ApiOperation({ summary: 'Add item to cart' })
  async addToCart(@CurrentUser('id') authUserId: string, @Body() body: { userId?: string; productId: string; quantity?: number }) {
    const userId = authUserId || body.userId;
    const item = await this.cartService.addToCart(userId, body.productId, body.quantity || 1);
    return {
      status: 'success',
      message: 'Item added to cart.',
      data: { item },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove item from cart' })
  async removeFromCart(@Param('id') id: string, @CurrentUser('id') authUserId: string, @Body() body: { userId?: string }) {
    const userId = authUserId || body.userId;
    await this.cartService.removeFromCart(userId, id);
    return {
      status: 'success',
      message: 'Item removed from cart.',
    };
  }
}
