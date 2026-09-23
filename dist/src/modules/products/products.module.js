"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsModule = void 0;
const common_1 = require("@nestjs/common");
const products_service_1 = require("./products.service");
const public_catalog_service_1 = require("./public-catalog.service");
const metals_service_1 = require("./metals.service");
const prices_service_1 = require("./prices.service");
const products_controller_1 = require("./products.controller");
const prices_controller_1 = require("./prices.controller");
const metals_controller_1 = require("./metals.controller");
const public_controller_1 = require("./public.controller");
const meilisearch_service_1 = require("../../shared/meilisearch/meilisearch.service");
const auth_module_1 = require("../auth/auth.module");
const redis_module_1 = require("../../shared/redis/redis.module");
const settings_module_1 = require("../settings/settings.module");
let ProductsModule = class ProductsModule {
};
exports.ProductsModule = ProductsModule;
exports.ProductsModule = ProductsModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, redis_module_1.RedisModule, settings_module_1.SettingsModule],
        controllers: [products_controller_1.ProductsController, prices_controller_1.PricesController, metals_controller_1.MetalsController, public_controller_1.PublicController],
        providers: [
            products_service_1.ProductsService,
            public_catalog_service_1.PublicCatalogService,
            metals_service_1.MetalsService,
            prices_service_1.PricesService,
            meilisearch_service_1.MeilisearchService,
        ],
        exports: [products_service_1.ProductsService, public_catalog_service_1.PublicCatalogService, metals_service_1.MetalsService, prices_service_1.PricesService],
    })
], ProductsModule);
//# sourceMappingURL=products.module.js.map