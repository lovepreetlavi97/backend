import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PromoCodesService } from './promocodes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Promo Codes & Coupons')
@Controller('promocodes')
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Post('validate')
  @ApiOperation({ summary: 'Validate coupon promo code for order checkout' })
  async validate(@Body() dto: { code: string; totalAmount: number }) {
    const result = await this.promoCodesService.validatePromoCode(dto.code, dto.totalAmount);
    return { status: 'success', data: result };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Create new promo coupon code' })
  async createPromo(@Body() dto: { code: string; discountPercent: number; maxDiscount?: number; validUntil: string }) {
    const result = await this.promoCodesService.createPromoCode({
      ...dto,
      validUntil: new Date(dto.validUntil),
    });
    return { status: 'success', message: 'Promo code created.', data: { promo: result } };
  }
}
