import { Controller, Get, Post, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get current user wishlist items' })
  async getUserWishlist(@Param('userId') userId: string, @CurrentUser() user: any) {
    if (user.id !== userId && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
      throw new ForbiddenException('Access denied: You can only view your own wishlist.');
    }
    const items = await this.wishlistService.getUserWishlist(userId);
    return {
      status: 'success',
      data: { items },
    };
  }

  @Post('toggle')
  @ApiOperation({ summary: 'Add or remove item from wishlist' })
  async toggleWishlist(@CurrentUser('id') authUserId: string, @Body() body: { userId?: string; productId: string }) {
    const userId = authUserId || body.userId;
    const result = await this.wishlistService.toggleWishlist(userId, body.productId);
    return {
      status: 'success',
      ...result,
    };
  }
}
