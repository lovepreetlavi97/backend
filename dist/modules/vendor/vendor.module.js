"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorModule = void 0;
const common_1 = require("@nestjs/common");
const vendor_service_1 = require("./vendor.service");
const vendor_product_service_1 = require("./vendor-product.service");
const vendor_order_service_1 = require("./vendor-order.service");
const vendor_controller_1 = require("./vendor.controller");
const admin_vendor_controller_1 = require("./admin-vendor.controller");
const auth_module_1 = require("../auth/auth.module");
const redis_module_1 = require("../../shared/redis/redis.module");
let VendorModule = class VendorModule {
};
exports.VendorModule = VendorModule;
exports.VendorModule = VendorModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, redis_module_1.RedisModule],
        controllers: [vendor_controller_1.VendorController, admin_vendor_controller_1.AdminVendorController],
        providers: [vendor_service_1.VendorService, vendor_product_service_1.VendorProductService, vendor_order_service_1.VendorOrderService],
        exports: [vendor_service_1.VendorService, vendor_product_service_1.VendorProductService, vendor_order_service_1.VendorOrderService],
    })
], VendorModule);
//# sourceMappingURL=vendor.module.js.map