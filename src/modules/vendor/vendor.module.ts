import { Module } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { VendorProductService } from './vendor-product.service';
import { VendorOrderService } from './vendor-order.service';
import { VendorController } from './vendor.controller';
import { AdminVendorController } from './admin-vendor.controller';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../../shared/redis/redis.module';

@Module({
  imports: [AuthModule, RedisModule],
  controllers: [VendorController, AdminVendorController],
  providers: [VendorService, VendorProductService, VendorOrderService],
  exports: [VendorService, VendorProductService, VendorOrderService],
})
export class VendorModule {}
