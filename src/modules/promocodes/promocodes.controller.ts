import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PromoCodesService } from './promocodes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Promo Codes & Coupons')
@Controller('promocodes')
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get all active promo codes for products (optionally filtered by showInProductDetail)' })
  async getActivePromos(@Query('productDetail') productDetail?: string) {
    const isProductDetail = productDetail === 'true' || productDetail === '1';
    const promos = await this.promoCodesService.getActivePromos(isProductDetail);
    return { status: 'success', data: { promos } };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate coupon promo code for order checkout' })
  async validate(@Body() dto: { code: string; totalAmount?: number }) {
    const result = await this.promoCodesService.validatePromoCode(dto.code, Number(dto.totalAmount) || 0);
    return { status: 'success', data: result, promo: result.promo };
  }

  @Get('validate/:code')
  @ApiOperation({ summary: 'Validate coupon promo code by URL parameter' })
  async validateByParam(@Param('code') code: string, @Query('totalAmount') totalAmount?: string) {
    const total = totalAmount ? parseFloat(totalAmount) : 0;
    const result = await this.promoCodesService.validatePromoCode(code, total);
    return { status: 'success', data: result, promo: result.promo };
  }

  @Get()
  @ApiOperation({ summary: 'Admin: Get all promo codes with pagination & filters' })
  async getAllPromoCodes(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const data = await this.promoCodesService.findAll({ page, limit, search, status });
    return {
      status: 'success',
      data,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get promo code by ID' })
  async getPromoById(@Param('id') id: string) {
    const promoCode = await this.promoCodesService.findById(id);
    return {
      status: 'success',
      data: { promoCode },
    };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Create new promo coupon code' })
  async createPromo(@Body() dto: any) {
    const result = await this.promoCodesService.createPromoCode(dto);
    return { status: 'success', message: 'Promo code created.', data: { promoCode: result } };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Update promo code by ID' })
  async updatePromo(@Param('id') id: string, @Body() dto: any) {
    const promoCode = await this.promoCodesService.updatePromoCode(id, dto);
    return { status: 'success', message: 'Promo code updated.', data: { promoCode } };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Delete promo code by ID' })
  async deletePromo(@Param('id') id: string) {
    await this.promoCodesService.deletePromoCode(id);
    return { status: 'success', message: 'Promo code deleted successfully.' };
  }

  @Patch(':id/toggle-status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Toggle promo code status' })
  async togglePromoStatus(@Param('id') id: string) {
    const promoCode = await this.promoCodesService.toggleStatus(id);
    return { status: 'success', message: 'Status updated.', data: { promoCode } };
  }

  @Patch(':id/toggle-product-detail')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Toggle promo code show in product detail page' })
  async toggleProductDetail(@Param('id') id: string) {
    const promoCode = await this.promoCodesService.toggleShowInProductDetail(id);
    return { status: 'success', message: 'Product detail display toggle updated.', data: { promoCode } };
  }
}
