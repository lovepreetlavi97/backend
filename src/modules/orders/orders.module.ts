import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ReturnsController } from './returns.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [OrdersController, ReturnsController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
