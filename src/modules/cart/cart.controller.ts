import { Controller, Get, Post, Delete, Body, Param, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { ProductsService } from '../products/products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly productsService: ProductsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get current user cart items (Website)' })
  async getWebsiteCart(@CurrentUser('id') userId: string) {
    const rawItems = await this.cartService.getUserCart(userId);
    const items = rawItems.map(item => {
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
        productId: product.id,
        name: product.title,
        slug: product.slug,
        image: product.images[0] || '',
        price: priceBreakdown.finalPrice,
        originalPrice: priceBreakdown.priceBeforeTax,
        discount: priceBreakdown.discountAmount,
        quantity: item.quantity,
        stock: product.stockQuantity,
      };
    });

    return {
      status: 'success',
      data: {
        cart: {
          items
        }
      }
    };
  }

  @Post('add')
  @ApiOperation({ summary: 'Add item to cart (Website)' })
  async addWebsiteCart(@CurrentUser('id') userId: string, @Body() body: { productId: string; quantity: number }) {
    await this.cartService.addToCart(userId, body.productId, body.quantity || 1);
    return this.getWebsiteCart(userId);
  }

  @Delete('remove')
  @ApiOperation({ summary: 'Remove item from cart (Website)' })
  async removeWebsiteCart(@CurrentUser('id') userId: string, @Body() body: { productId: string }) {
    const items = await this.cartService.getUserCart(userId);
    const item = items.find(i => i.productId === body.productId);
    if (item) {
      await this.cartService.removeFromCart(userId, item.id);
    }
    return this.getWebsiteCart(userId);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync guest cart (Website)' })
  async syncWebsiteCart(@CurrentUser('id') userId: string, @Body() body: { items: { productId: string; quantity: number }[] }) {
    if (body.items && Array.isArray(body.items)) {
      for (const item of body.items) {
        await this.cartService.addToCart(userId, item.productId, item.quantity);
      }
    }
    return this.getWebsiteCart(userId);
  }

  @Post('update-quantity')
  @ApiOperation({ summary: 'Update cart item quantity (Website)' })
  async updateQuantityWebsiteCart(
    @CurrentUser('id') userId: string,
    @Body() body: { productId: string; action: 'inc' | 'dec' }
  ) {
    const items = await this.cartService.getUserCart(userId);
    const item = items.find(i => i.productId === body.productId);
    if (item) {
      const newQuantity = body.action === 'inc' ? item.quantity + 1 : item.quantity - 1;
      if (newQuantity <= 0) {
        await this.cartService.removeFromCart(userId, item.id);
      } else {
        await this.cartService.prisma.cart.update({
          where: { id: item.id },
          data: { quantity: newQuantity }
        });
      }
    }
    return this.getWebsiteCart(userId);
  }

  // === Mobile/Admin API compatibility ===
  @Get(':userId')
  @ApiOperation({ summary: 'Get current user cart items (Mobile/Admin)' })
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
  @ApiOperation({ summary: 'Add item to cart (Mobile/Admin)' })
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
  @ApiOperation({ summary: 'Remove item from cart (Mobile/Admin)' })
  async removeFromCart(@Param('id') id: string, @CurrentUser('id') authUserId: string, @Body() body: { userId?: string }) {
    const userId = authUserId || body.userId;
    await this.cartService.removeFromCart(userId, id);
    return {
      status: 'success',
      message: 'Item removed from cart.',
    };
  }
}
