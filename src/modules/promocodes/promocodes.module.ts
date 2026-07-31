import { Module } from '@nestjs/common';
import { PromoCodesService } from './promocodes.service';
import { PromoCodesController } from './promocodes.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [PromoCodesController],
  providers: [PromoCodesService],
  exports: [PromoCodesService],
})
export class PromoCodesModule {}
