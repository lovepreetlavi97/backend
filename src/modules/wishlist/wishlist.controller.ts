import { Controller, Get, Post, Delete, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { ProductsService } from '../products/products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(
    private readonly wishlistService: WishlistService,
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current user wishlist items (Website)' })
  async getWebsiteWishlist(@CurrentUser('id') userId: string) {
    const items = await this.wishlistService.getUserWishlist(userId);
    const products = items.map(item => {
      const product = item.product;
      const ratePerGram = product.metal ? Number(product.metal.ratePerGram) : 6500;
      const makingCharge = product.priceRule ? Number(product.priceRule.makingChargeGram) : 450;
      const gstPercent = product.priceRule ? Number(product.priceRule.gstPercentage) : 3.0;
      const discountPercent = product.priceRule ? Number(product.priceRule.discountPercent) : 0.0;

      const priceBreakdown = this.productsService.calculatePrice(
        Number(product.weightGrams),
        ratePerGram,
        makingCharge,
        gstPercent,
        discountPercent
      );

      return {
        _id: product.id,
        name: product.title,
        slug: product.slug,
        image: product.images[0] || '',
        price: priceBreakdown.finalPrice,
        originalPrice: priceBreakdown.priceBeforeTax,
        discount: priceBreakdown.discountAmount,
        stock: product.stockQuantity,
      };
    });

    return {
      status: 'success',
      data: {
        wishlist: {
          products
        }
      }
    };
  }

  @Post('add')
  @ApiOperation({ summary: 'Add item to wishlist (Website)' })
  async addWebsiteWishlist(@CurrentUser('id') userId: string, @Body() body: { productId: string }) {
    const existing = await this.wishlistService.prisma.wishlist.findFirst({
      where: { userId, productId: body.productId }
    });
    if (!existing) {
      await this.wishlistService.prisma.wishlist.create({
        data: { userId, productId: body.productId }
      });
    }
    return this.getWebsiteWishlist(userId);
  }

  @Delete('remove')
  @ApiOperation({ summary: 'Remove item from wishlist (Website)' })
  async removeWebsiteWishlist(@CurrentUser('id') userId: string, @Body() body: { productId: string }) {
    const existing = await this.wishlistService.prisma.wishlist.findFirst({
      where: { userId, productId: body.productId }
    });
    if (existing) {
      await this.wishlistService.prisma.wishlist.delete({
        where: { id: existing.id }
      });
    }
    return this.getWebsiteWishlist(userId);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync guest wishlist (Website)' })
  async syncWebsiteWishlist(@CurrentUser('id') userId: string, @Body() body: { products: string[] }) {
    if (body.products && Array.isArray(body.products)) {
      for (const prodId of body.products) {
        const existing = await this.wishlistService.prisma.wishlist.findFirst({
          where: { userId, productId: prodId }
        });
        if (!existing) {
          await this.wishlistService.prisma.wishlist.create({
            data: { userId, productId: prodId }
          });
        }
      }
    }
    return this.getWebsiteWishlist(userId);
  }

  // === Mobile/Admin API compatibility ===
  @Get(':userId')
  @ApiOperation({ summary: 'Get current user wishlist items (Mobile/Admin)' })
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
  @ApiOperation({ summary: 'Add or remove item from wishlist (Mobile/Admin)' })
  async toggleWishlist(@CurrentUser('id') authUserId: string, @Body() body: { userId?: string; productId: string }) {
    const userId = authUserId || body.userId;
    const result = await this.wishlistService.toggleWishlist(userId, body.productId);
    return {
      status: 'success',
      ...result,
    };
  }
}
