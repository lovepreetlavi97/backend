import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PricesController } from './prices.controller';
import { MeilisearchService } from '../../shared/meilisearch/meilisearch.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProductsController, PricesController],
  providers: [ProductsService, MeilisearchService],
  exports: [ProductsService],
})
export class ProductsModule {}
