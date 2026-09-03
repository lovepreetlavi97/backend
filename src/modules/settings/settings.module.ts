import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { FilterConfigService } from './filter-config.service';
import { SettingsController } from './settings.controller';
import { AdminSiteSettingsController } from './admin-site-settings.controller';
import { FestivalsController } from './festivals.controller';
import { RelationsController } from './relations.controller';
import { GiftsController } from './gifts.controller';
import { GrievancesController } from './grievances.controller';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../../shared/redis/redis.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [AuthModule, RedisModule, UploadsModule],
  controllers: [
    SettingsController,
    AdminSiteSettingsController,
    FestivalsController,
    RelationsController,
    GiftsController,
    GrievancesController,
  ],
  providers: [SettingsService, FilterConfigService],
  exports: [SettingsService, FilterConfigService],
})
export class SettingsModule {}
