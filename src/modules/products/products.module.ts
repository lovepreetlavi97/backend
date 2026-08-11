import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PublicCatalogService } from './public-catalog.service';
import { MetalsService } from './metals.service';
import { PricesService } from './prices.service';
import { ProductsController } from './products.controller';
import { PricesController } from './prices.controller';
import { MetalsController } from './metals.controller';
import { PublicController } from './public.controller';
import { MeilisearchService } from '../../shared/meilisearch/meilisearch.service';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../../shared/redis/redis.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [AuthModule, RedisModule, SettingsModule],
  controllers: [ProductsController, PricesController, MetalsController, PublicController],
  providers: [
    ProductsService,
    PublicCatalogService,
    MetalsService,
    PricesService,
    MeilisearchService,
  ],
  exports: [ProductsService, PublicCatalogService, MetalsService, PricesService],
})
export class ProductsModule {}
