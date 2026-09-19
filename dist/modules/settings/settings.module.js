"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsModule = void 0;
const common_1 = require("@nestjs/common");
const settings_service_1 = require("./settings.service");
const filter_config_service_1 = require("./filter-config.service");
const settings_controller_1 = require("./settings.controller");
const admin_site_settings_controller_1 = require("./admin-site-settings.controller");
const festivals_controller_1 = require("./festivals.controller");
const relations_controller_1 = require("./relations.controller");
const gifts_controller_1 = require("./gifts.controller");
const grievances_controller_1 = require("./grievances.controller");
const auth_module_1 = require("../auth/auth.module");
const redis_module_1 = require("../../shared/redis/redis.module");
const uploads_module_1 = require("../uploads/uploads.module");
let SettingsModule = class SettingsModule {
};
exports.SettingsModule = SettingsModule;
exports.SettingsModule = SettingsModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, redis_module_1.RedisModule, uploads_module_1.UploadsModule],
        controllers: [
            settings_controller_1.SettingsController,
            admin_site_settings_controller_1.AdminSiteSettingsController,
            festivals_controller_1.FestivalsController,
            relations_controller_1.RelationsController,
            gifts_controller_1.GiftsController,
            grievances_controller_1.GrievancesController,
        ],
        providers: [settings_service_1.SettingsService, filter_config_service_1.FilterConfigService],
        exports: [settings_service_1.SettingsService, filter_config_service_1.FilterConfigService],
    })
], SettingsModule);
//# sourceMappingURL=settings.module.js.map