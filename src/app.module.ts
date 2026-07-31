import { Module } from '@nestjs/common';
import { PrismaService } from './modules/prisma/prisma.service';
import { ProductsService } from './modules/products/products.service';
import { ProductsController } from './modules/products/products.controller';
import { KittyService } from './modules/kitty/kitty.service';
import { KittyController } from './modules/kitty/kitty.controller';
import { PaymentsService } from './modules/payments/payments.service';
import { PaymentsController } from './modules/payments/payments.controller';
import { OrdersService } from './modules/orders/orders.service';
import { OrdersController } from './modules/orders/orders.controller';
import { AuthService } from './modules/auth/auth.service';
import { AuthController } from './modules/auth/auth.controller';
import { CategoriesService } from './modules/categories/categories.service';
import { CategoriesController } from './modules/categories/categories.controller';
import { UploadsService } from './modules/uploads/uploads.service';

@Module({
  imports: [],
  controllers: [
    ProductsController,
    KittyController,
    PaymentsController,
    OrdersController,
    AuthController,
    CategoriesController,
  ],
  providers: [
    PrismaService,
    ProductsService,
    KittyService,
    PaymentsService,
    OrdersService,
    AuthService,
    CategoriesService,
    UploadsService,
  ],
})
export class AppModule {}
