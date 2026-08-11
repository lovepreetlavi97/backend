import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VendorService } from './vendor.service';
import { VendorProductService } from './vendor-product.service';
import { VendorOrderService } from './vendor-order.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VendorGuard } from '../../common/guards/vendor.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  RegisterVendorDto,
  UpdateVendorProfileDto,
  CreateVendorProductDto,
  UpdateVendorProductDto,
  UpdateShipmentDto,
} from './dto/vendor.dto';

@ApiTags('Vendor Portal')
@Controller('vendor')
export class VendorController {
  constructor(
    private readonly vendorService: VendorService,
    private readonly vendorProductService: VendorProductService,
    private readonly vendorOrderService: VendorOrderService,
  ) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register new vendor account' })
  async registerVendor(@CurrentUser('id') userId: string, @Body() dto: RegisterVendorDto) {
    const vendor = await this.vendorService.registerVendor(userId, dto);
    return {
      status: 'success',
      message: 'Vendor application submitted successfully. Pending admin review.',
      data: { vendor },
    };
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check vendor onboarding status & rejection reason' })
  async getStatus(@CurrentUser('id') userId: string) {
    const status = await this.vendorService.getVendorStatus(userId);
    return {
      status: 'success',
      data: status,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get authenticated vendor profile' })
  async getProfile(@Req() req: any) {
    const profile = await this.vendorService.getVendorProfile(req.user.vendorId);
    return {
      status: 'success',
      data: { profile },
    };
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update vendor profile' })
  async updateProfile(@Req() req: any, @Body() dto: UpdateVendorProfileDto) {
    const profile = await this.vendorService.updateVendorProfile(req.user.vendorId, dto);
    return {
      status: 'success',
      message: 'Vendor profile updated.',
      data: { profile },
    };
  }

  // === Product Management ===
  @Post('products')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create vendor product (Draft or Submit for Approval)' })
  async createProduct(@Req() req: any, @Body() dto: CreateVendorProductDto) {
    const product = await this.vendorProductService.createVendorProduct(req.user.vendorId, dto);
    return {
      status: 'success',
      message: dto.submitForApproval
        ? 'Product submitted for admin approval.'
        : 'Product draft saved.',
      data: { product },
    };
  }

  @Get('products')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List vendor products' })
  async getProducts(
    @Req() req: any,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('status') status?: string,
  ) {
    const page = Math.max(1, parseInt(pageStr || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(limitStr || '20', 10)));

    const result = await this.vendorProductService.getVendorProducts(
      req.user.vendorId,
      page,
      limit,
      status,
    );

    return {
      status: 'success',
      data: result,
    };
  }

  @Get('products/:id')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vendor product details & rejection reason' })
  async getProductById(@Req() req: any, @Param('id') id: string) {
    const product = await this.vendorProductService.getVendorProductById(req.user.vendorId, id);
    return {
      status: 'success',
      data: { product },
    };
  }

  @Put('products/:id')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update vendor product & resubmit for approval' })
  async updateProduct(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateVendorProductDto,
  ) {
    const product = await this.vendorProductService.updateVendorProduct(
      req.user.vendorId,
      id,
      dto,
    );

    return {
      status: 'success',
      message: dto.submitForApproval
        ? 'Product updated and resubmitted for admin approval.'
        : 'Product updated.',
      data: { product },
    };
  }

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete vendor product' })
  async deleteProduct(@Req() req: any, @Param('id') id: string) {
    await this.vendorProductService.deleteVendorProduct(req.user.vendorId, id);
    return {
      status: 'success',
      message: 'Product deleted.',
    };
  }

  // === Order Fulfillment ===
  @Get('orders')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List assigned vendor sub-orders' })
  async getOrders(
    @Req() req: any,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('status') status?: string,
  ) {
    const page = Math.max(1, parseInt(pageStr || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(limitStr || '20', 10)));

    const result = await this.vendorOrderService.getVendorOrders(
      req.user.vendorId,
      page,
      limit,
      status,
    );

    return {
      status: 'success',
      data: result,
    };
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vendor sub-order details' })
  async getOrderById(@Req() req: any, @Param('id') id: string) {
    const order = await this.vendorOrderService.getVendorOrderById(req.user.vendorId, id);
    return {
      status: 'success',
      data: { order },
    };
  }

  @Put('orders/:id/status')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update sub-order status (CONFIRMED, PACKED, SHIPPED, DELIVERED)' })
  async updateOrderStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    const order = await this.vendorOrderService.updateVendorOrderStatus(
      req.user.vendorId,
      id,
      status,
    );

    return {
      status: 'success',
      message: `Sub-order status updated to ${status}.`,
      data: { order },
    };
  }

  @Put('orders/:id/shipment')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add shipment tracking number & carrier' })
  async updateShipment(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateShipmentDto,
  ) {
    const order = await this.vendorOrderService.updateTrackingInfo(
      req.user.vendorId,
      id,
      dto,
    );

    return {
      status: 'success',
      message: 'Shipment tracking information updated.',
      data: { order },
    };
  }
}
