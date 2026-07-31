import { Module } from '@nestjs/common';
import { PrismaModule } from './modules/prisma/prisma.module';
import { RedisModule } from './shared/redis/redis.module';
import { QueueModule } from './shared/queue/queue.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdminsModule } from './modules/admins/admins.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BannersModule } from './modules/banners/banners.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PromoCodesModule } from './modules/promocodes/promocodes.module';
import { CartModule } from './modules/cart/cart.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { KittyModule } from './modules/kitty/kitty.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    QueueModule,
    AuthModule,
    UsersModule,
    AdminsModule,
    ProductsModule,
    CategoriesModule,
    BannersModule,
    OrdersModule,
    PaymentsModule,
    PromoCodesModule,
    CartModule,
    WishlistModule,
    KittyModule,
    ReviewsModule,
    NotificationsModule,
    DashboardModule,
    SettingsModule,
    UploadsModule,
    HealthModule,
  ],
})
export class AppModule {}
