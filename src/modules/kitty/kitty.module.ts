import { Module } from '@nestjs/common';
import { KittyService } from './kitty.service';
import { KittyController } from './kitty.controller';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../../shared/redis/redis.module';

@Module({
  imports: [AuthModule, RedisModule],
  controllers: [KittyController],
  providers: [KittyService],
  exports: [KittyService],
})
export class KittyModule {}
