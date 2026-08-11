import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VendorService } from './vendor.service';
import { VendorProductService } from './vendor-product.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { RejectReasonDto } from './dto/vendor.dto';

@ApiTags('Admin - Vendor Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
@Controller('admin')
export class AdminVendorController {
  constructor(
    private readonly vendorService: VendorService,
    private readonly vendorProductService: VendorProductService,
  ) {}

  @Get('vendors')
  @ApiOperation({ summary: 'Admin: List all vendor accounts & applications' })
  async getVendors(@Query('status') status?: string) {
    const vendors = await this.vendorService.getAllVendors(status);
    return {
      status: 'success',
      data: { vendors },
    };
  }

  @Put('vendors/:id/approve')
  @ApiOperation({ summary: 'Admin: Approve vendor application' })
  async approveVendor(@Param('id') id: string) {
    const vendor = await this.vendorService.approveVendor(id);
    return {
      status: 'success',
      message: 'Vendor application approved.',
      data: { vendor },
    };
  }

  @Put('vendors/:id/reject')
  @ApiOperation({ summary: 'Admin: Reject vendor application with reason' })
  async rejectVendor(@Param('id') id: string, @Body() dto: RejectReasonDto) {
    const vendor = await this.vendorService.rejectVendor(id, dto.reason);
    return {
      status: 'success',
      message: 'Vendor application rejected.',
      data: { vendor },
    };
  }

  @Put('vendors/:id/suspend')
  @ApiOperation({ summary: 'Admin: Suspend vendor account' })
  async suspendVendor(@Param('id') id: string) {
    const vendor = await this.vendorService.suspendVendor(id);
    return {
      status: 'success',
      message: 'Vendor account suspended.',
      data: { vendor },
    };
  }

  // === Product Approval Queue ===
  @Get('vendor-products/pending')
  @ApiOperation({ summary: 'Admin: List vendor products pending approval' })
  async getPendingProducts() {
    const products = await this.vendorProductService.getPendingProducts();
    return {
      status: 'success',
      data: { products },
    };
  }

  @Put('vendor-products/:id/approve')
  @ApiOperation({ summary: 'Admin: Approve vendor product (Publishes to MYG Website)' })
  async approveProduct(@Param('id') id: string) {
    const product = await this.vendorProductService.approveProduct(id);
    return {
      status: 'success',
      message: 'Vendor product approved and published to MYG website.',
      data: { product },
    };
  }

  @Put('vendor-products/:id/reject')
  @ApiOperation({ summary: 'Admin: Reject vendor product with reason' })
  async rejectProduct(@Param('id') id: string, @Body() dto: RejectReasonDto) {
    const product = await this.vendorProductService.rejectProduct(id, dto.reason);
    return {
      status: 'success',
      message: 'Vendor product rejected.',
      data: { product },
    };
  }
}
