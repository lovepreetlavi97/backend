import { Module } from '@nestjs/common';
import { KittyService } from './kitty.service';
import { KittyController } from './kitty.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [KittyController],
  providers: [KittyService],
  exports: [KittyService],
})
export class KittyModule {}
