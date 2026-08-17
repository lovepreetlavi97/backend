import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { FilterConfigService } from './filter-config.service';
import { SettingsController } from './settings.controller';
import { FestivalsController } from './festivals.controller';
import { RelationsController } from './relations.controller';
import { GiftsController } from './gifts.controller';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../../shared/redis/redis.module';

@Module({
  imports: [AuthModule, RedisModule],
  controllers: [
    SettingsController,
    FestivalsController,
    RelationsController,
    GiftsController,
  ],
  providers: [SettingsService, FilterConfigService],
  exports: [SettingsService, FilterConfigService],
})
export class SettingsModule {}
