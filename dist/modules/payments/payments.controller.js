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
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const payments_service_1 = require("./payments.service");
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    async createPaymentOrder(body) {
        const result = await this.paymentsService.createRazorpayOrder(body.amount, body.orderId);
        return {
            status: 'success',
            ...result,
        };
    }
    async verifyPayment(dto) {
        const razorpayOrderId = dto.razorpayOrderId || dto.razorpay_order_id;
        const razorpayPaymentId = dto.razorpayPaymentId || dto.razorpay_payment_id;
        const signature = dto.signature || dto.razorpay_signature;
        const orderId = dto.orderId;
        const result = await this.paymentsService.processPaymentVerification(orderId, razorpayOrderId, razorpayPaymentId, signature);
        return {
            status: 'success',
            message: 'Payment verified successfully.',
            data: result,
        };
    }
    async getAllTransactions(query) {
        const result = await this.paymentsService.getAllTransactions(query);
        return {
            status: 'success',
            data: result,
        };
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createPaymentOrder", null);
__decorate([
    (0, common_1.Post)('verify'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Get)('transactions'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getAllTransactions", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)('payment'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map