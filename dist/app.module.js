"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("./modules/prisma/prisma.module");
const redis_module_1 = require("./shared/redis/redis.module");
const queue_module_1 = require("./shared/queue/queue.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const admins_module_1 = require("./modules/admins/admins.module");
const products_module_1 = require("./modules/products/products.module");
const categories_module_1 = require("./modules/categories/categories.module");
const banners_module_1 = require("./modules/banners/banners.module");
const orders_module_1 = require("./modules/orders/orders.module");
const payments_module_1 = require("./modules/payments/payments.module");
const promocodes_module_1 = require("./modules/promocodes/promocodes.module");
const cart_module_1 = require("./modules/cart/cart.module");
const wishlist_module_1 = require("./modules/wishlist/wishlist.module");
const kitty_module_1 = require("./modules/kitty/kitty.module");
const reviews_module_1 = require("./modules/reviews/reviews.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const settings_module_1 = require("./modules/settings/settings.module");
const uploads_module_1 = require("./modules/uploads/uploads.module");
const health_module_1 = require("./modules/health/health.module");
const email_module_1 = require("./modules/email/email.module");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const vendor_module_1 = require("./modules/vendor/vendor.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 500,
                },
            ]),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            queue_module_1.QueueModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            admins_module_1.AdminsModule,
            vendor_module_1.VendorModule,
            products_module_1.ProductsModule,
            categories_module_1.CategoriesModule,
            banners_module_1.BannersModule,
            orders_module_1.OrdersModule,
            payments_module_1.PaymentsModule,
            promocodes_module_1.PromoCodesModule,
            cart_module_1.CartModule,
            wishlist_module_1.WishlistModule,
            kitty_module_1.KittyModule,
            reviews_module_1.ReviewsModule,
            notifications_module_1.NotificationsModule,
            dashboard_module_1.DashboardModule,
            settings_module_1.SettingsModule,
            uploads_module_1.UploadsModule,
            health_module_1.HealthModule,
            email_module_1.EmailModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map