"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KittyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const kitty_service_1 = require("./kitty.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let KittyController = class KittyController {
    constructor(kittyService) {
        this.kittyService = kittyService;
    }
    async getActivePlans(category, page, limit) {
        return this.kittyService.getPlans({
            category,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
    }
    async enrollInKitty(userId, body) {
        return this.kittyService.enrollInKitty(userId, body.planId);
    }
    async getMyKitties(userId, status, page, limit) {
        return this.kittyService.getMyKitties(userId, {
            status,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
    }
    async getMyKittyDetails(userId, kittyId) {
        return this.kittyService.getMyKittyDetails(userId, kittyId);
    }
    async initiateKittyPayment(userId, body) {
        const result = await this.kittyService.initiateKittyPayment(userId, body.paymentId);
        return {
            status: 'success',
            data: result,
        };
    }
    async cancelMyKitty(userId, kittyId) {
        return this.kittyService.cancelMyKitty(userId, kittyId);
    }
    async getAdminPlans() {
        return this.kittyService.getAdminPlans();
    }
    async getPlanById(planId) {
        return this.kittyService.getPlanById(planId);
    }
    async createPlan(body) {
        return this.kittyService.createPlan(body);
    }
    async updatePlan(planId, body) {
        return this.kittyService.updatePlan(planId, body);
    }
    async deletePlan(planId) {
        return this.kittyService.deletePlan(planId);
    }
    async getAdminEnrollments(status, planId, userId, page, limit) {
        return this.kittyService.getAdminEnrollments({
            status,
            planId,
            userId,
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        });
    }
    async getAdminStatistics() {
        return this.kittyService.getAdminStatistics();
    }
    async recordManualPayment(body) {
        return this.kittyService.recordManualPayment(body.paymentId, body.method, body.receiptId, body.amount);
    }
    async getAdminUserKitty(kittyId) {
        return this.kittyService.getSubscriptionDetails(kittyId);
    }
    async updateUserKittyStatus(kittyId, body) {
        return this.kittyService.updateUserKittyStatus(kittyId, body.status, body.reason);
    }
    async getOverduePayments() {
        return this.kittyService.getOverduePayments();
    }
    async sendPaymentReminders(body) {
        return this.kittyService.sendPaymentReminders(body.paymentIds);
    }
    async seedDummy(body) {
        return this.kittyService.seedDummy(body);
    }
    async getSubscriptionDetails(id) {
        return this.kittyService.getSubscriptionDetails(id);
    }
};
exports.KittyController = KittyController;
__decorate([
    (0, common_1.Get)('plans'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active kitty plans' }),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "getActivePlans", null);
__decorate([
    (0, common_1.Post)('enroll'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Enroll in a savings plan' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "enrollInKitty", null);
__decorate([
    (0, common_1.Get)('my-kitties'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get logged-in user's active subscriptions" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "getMyKitties", null);
__decorate([
    (0, common_1.Get)('my-kitties/:kittyId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get specific user subscription details' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('kittyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "getMyKittyDetails", null);
__decorate([
    (0, common_1.Post)('payment/initiate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Initiate razorpay payment order for kitty monthly installment' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "initiateKittyPayment", null);
__decorate([
    (0, common_1.Post)('my-kitties/:kittyId/cancel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel/Close savings scheme subscription' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('kittyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "cancelMyKitty", null);
__decorate([
    (0, common_1.Get)('admin/plans'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get all savings plans' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "getAdminPlans", null);
__decorate([
    (0, common_1.Get)('admin/plans/:planId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get plan by ID' }),
    __param(0, (0, common_1.Param)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "getPlanById", null);
__decorate([
    (0, common_1.Post)('admin/plans'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Create new plan' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Put)('admin/plans/:planId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update plan details' }),
    __param(0, (0, common_1.Param)('planId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Delete)('admin/plans/:planId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Delete/deactivate plan' }),
    __param(0, (0, common_1.Param)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "deletePlan", null);
__decorate([
    (0, common_1.Get)('admin/enrollments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: List user scheme enrollments' }),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('planId')),
    __param(2, (0, common_1.Query)('userId')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "getAdminEnrollments", null);
__decorate([
    (0, common_1.Get)('admin/statistics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get scheme stats' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "getAdminStatistics", null);
__decorate([
    (0, common_1.Post)('admin/manual-payment'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Log cash or offline transfer payment' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "recordManualPayment", null);
__decorate([
    (0, common_1.Get)('admin/user-kitty/:kittyId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Get details of a scheme enrollment' }),
    __param(0, (0, common_1.Param)('kittyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "getAdminUserKitty", null);
__decorate([
    (0, common_1.Put)('admin/user-kitty/:kittyId/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Update enrollment status (pause/resume/cancel)' }),
    __param(0, (0, common_1.Param)('kittyId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "updateUserKittyStatus", null);
__decorate([
    (0, common_1.Get)('admin/overdue-payments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: List overdue subscriptions' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "getOverduePayments", null);
__decorate([
    (0, common_1.Post)('admin/send-reminders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Push reminders for overdue accounts' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "sendPaymentReminders", null);
__decorate([
    (0, common_1.Post)('admin/seed'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPERADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: Seed dummy kitty savings plans and enrollments' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "seedDummy", null);
__decorate([
    (0, common_1.Get)('subscription/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve subscription status' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KittyController.prototype, "getSubscriptionDetails", null);
exports.KittyController = KittyController = __decorate([
    (0, swagger_1.ApiTags)('Kitty Savings'),
    (0, common_1.Controller)('kitty'),
    __metadata("design:paramtypes", [kitty_service_1.KittyService])
], KittyController);
//# sourceMappingURL=kitty.controller.js.map