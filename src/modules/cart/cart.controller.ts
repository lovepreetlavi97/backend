import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Headers,
  UseGuards,
  ForbiddenException,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { ProductsService } from '../products/products.service';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly productsService: ProductsService,
  ) {}

  private extractCartIdentity(req: any, headerGuestId?: string, bodyGuestId?: string) {
    const userId = req.user?.id || null;
    const guestId = !userId ? (headerGuestId || bodyGuestId || 'guest_default_session') : null;
    return { userId, guestId };
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get cart items (Website Guest / User)' })
  async getWebsiteCart(
    @Req() req: any,
    @Headers('x-guest-id') headerGuestId?: string,
  ) {
    const { userId, guestId } = this.extractCartIdentity(req, headerGuestId);
    const rawItems = await this.cartService.getCart(userId || undefined, guestId || undefined);

    const items = rawItems.map((item) => {
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
        discountPercent,
      );

      return {
        id: item.id,
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
        cart: { items },
      },
    };
  }

  @Post('add')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Add item to cart (Website Guest / User)' })
  async addWebsiteCart(
    @Req() req: any,
    @Headers('x-guest-id') headerGuestId: string,
    @Body() body: { productId: string; quantity?: number; guestId?: string },
  ) {
    const { userId, guestId } = this.extractCartIdentity(req, headerGuestId, body.guestId);
    await this.cartService.addToCart(userId, guestId, body.productId, body.quantity || 1);
    return this.getWebsiteCart(req, headerGuestId || body.guestId);
  }

  @Delete('remove')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Remove item from cart (Website Guest / User)' })
  async removeWebsiteCart(
    @Req() req: any,
    @Headers('x-guest-id') headerGuestId: string,
    @Body() body: { productId?: string; cartItemId?: string; guestId?: string },
  ) {
    const { userId, guestId } = this.extractCartIdentity(req, headerGuestId, body.guestId);
    const items = await this.cartService.getCart(userId || undefined, guestId || undefined);

    const item = items.find(
      (i) => i.productId === body.productId || i.id === body.cartItemId,
    );

    if (item) {
      await this.cartService.removeFromCart(item.id, userId || undefined, guestId || undefined);
    }

    return this.getWebsiteCart(req, headerGuestId || body.guestId);
  }

  @Post('update-quantity')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Update cart item quantity (Website Guest / User)' })
  async updateQuantityWebsiteCart(
    @Req() req: any,
    @Headers('x-guest-id') headerGuestId: string,
    @Body() body: { productId: string; action: 'inc' | 'dec'; guestId?: string },
  ) {
    const { userId, guestId } = this.extractCartIdentity(req, headerGuestId, body.guestId);
    const items = await this.cartService.getCart(userId || undefined, guestId || undefined);
    const item = items.find((i) => i.productId === body.productId);

    if (item) {
      const newQuantity = body.action === 'inc' ? item.quantity + 1 : item.quantity - 1;
      if (newQuantity <= 0) {
        await this.cartService.removeFromCart(item.id, userId || undefined, guestId || undefined);
      } else {
        await this.cartService.prisma.cart.update({
          where: { id: item.id },
          data: { quantity: newQuantity },
        });
      }
    }

    return this.getWebsiteCart(req, headerGuestId || body.guestId);
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync guest cart items to user account upon login' })
  async syncGuestCart(
    @CurrentUser('id') userId: string,
    @Headers('x-guest-id') headerGuestId: string,
    @Body() body: { guestId?: string; items?: { productId: string; quantity: number }[] },
  ) {
    const guestId = body.guestId || headerGuestId;
    if (guestId) {
      await this.cartService.syncGuestCartToUser(guestId, userId);
    }

    if (body.items && Array.isArray(body.items)) {
      for (const item of body.items) {
        await this.cartService.addToCart(userId, null, item.productId, item.quantity);
      }
    }

    return this.cartService.getUserCart(userId);
  }

  // === Mobile/Admin API compatibility ===
  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
}
