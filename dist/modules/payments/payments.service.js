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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../../shared/redis/redis.service");
const env_config_1 = require("../../config/env.config");
let PaymentsService = class PaymentsService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        const config = (0, env_config_1.getEnvConfig)();
        this.razorpaySecret = config.razorpayKeySecret;
        this.razorpay = new Razorpay({
            key_id: config.razorpayKeyId,
            key_secret: config.razorpayKeySecret,
        });
    }
    verifySignature(razorpayOrderId, razorpayPaymentId, signature) {
        if (!razorpayOrderId || !razorpayPaymentId || !signature) {
            return false;
        }
        const body = `${razorpayOrderId}|${razorpayPaymentId}`;
        const expectedSignature = crypto
            .createHmac('sha256', this.razorpaySecret)
            .update(body)
            .digest('hex');
        const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
        const actualBuf = Buffer.from(signature, 'utf-8');
        if (expectedBuf.length !== actualBuf.length) {
            return false;
        }
        return crypto.timingSafeEqual(expectedBuf, actualBuf);
    }
    async processPaymentVerification(orderId, razorpayOrderId, razorpayPaymentId, signature) {
        const isValid = this.verifySignature(razorpayOrderId, razorpayPaymentId, signature);
        if (!isValid) {
            throw new common_1.BadRequestException('Invalid payment signature verification failed.');
        }
        let existingOrder = null;
        if (orderId) {
            existingOrder = await this.prisma.order.findUnique({
                where: { id: orderId },
                include: { transactions: true },
            });
        }
        else if (razorpayOrderId) {
            existingOrder = await this.prisma.order.findFirst({
                where: { razorpayOrderId },
                include: { transactions: true },
            });
        }
        if (existingOrder) {
            if (existingOrder.paymentStatus === 'PAID') {
                return {
                    message: 'Payment already processed successfully (Idempotent call).',
                    order: existingOrder,
                    transaction: existingOrder.transactions[0] || null,
                };
            }
            return this.prisma.$transaction(async (tx) => {
                const order = await tx.order.update({
                    where: { id: existingOrder.id },
                    data: {
                        paymentStatus: 'PAID',
                        orderStatus: 'PROCESSING',
                        razorpayOrderId,
                    },
                });
                const transaction = await tx.transaction.create({
                    data: {
                        orderId: order.id,
                        paymentId: razorpayPaymentId,
                        amount: order.finalAmount,
                        currency: 'INR',
                        status: 'PAID',
                        gatewayResponse: { razorpayOrderId, razorpayPaymentId, signature },
                    },
                });
                return { order, transaction };
            });
        }
        const kittyPaymentData = await this.redis.get(`pending-kitty-payment:${razorpayOrderId}`);
        if (!kittyPaymentData) {
            throw new common_1.NotFoundException(`Payment association not found for Razorpay Order ID '${razorpayOrderId}'.`);
        }
        const { userKittyId, installmentIndex } = kittyPaymentData;
        const userKitty = await this.prisma.userKitty.findUnique({
            where: { id: userKittyId },
            include: { plan: true },
        });
        if (!userKitty) {
            throw new common_1.NotFoundException(`User Kitty subscription '${userKittyId}' not found.`);
        }
        if (userKitty.paidMonths > installmentIndex) {
            return {
                message: 'Installment payment already processed successfully (Idempotent call).',
                userKitty,
            };
        }
        const monthlyAmount = Number(userKitty.plan.monthlyAmount);
        return this.prisma.$transaction(async (tx) => {
            const newPaidMonths = userKitty.paidMonths + 1;
            const totalMonths = userKitty.plan.totalMonths;
            const isCompleted = newPaidMonths >= totalMonths;
            const newStatus = isCompleted ? 'COMPLETED' : 'ACTIVE';
            const currentDueDate = new Date(userKitty.nextDueDate);
            const nextDueDate = new Date(currentDueDate.setMonth(currentDueDate.getMonth() + 1));
            const updatedKitty = await tx.userKitty.update({
                where: { id: userKittyId },
                data: {
                    paidMonths: newPaidMonths,
                    totalAccumulated: { increment: monthlyAmount },
                    status: newStatus,
                    nextDueDate: nextDueDate,
                },
            });
            const transaction = await tx.transaction.create({
                data: {
                    paymentId: razorpayPaymentId,
                    amount: monthlyAmount,
                    currency: 'INR',
                    status: 'PAID',
                    gatewayResponse: {
                        razorpayOrderId,
                        razorpayPaymentId,
                        signature,
                        userKittyId,
                        installmentIndex,
                    },
                },
            });
            await this.redis.del(`pending-kitty-payment:${razorpayOrderId}`);
            return { userKitty: updatedKitty, transaction };
        });
    }
    async createRazorpayOrder(amount, orderId) {
        try {
            const order = await this.razorpay.orders.create({
                amount: Math.round(amount * 100),
                currency: 'INR',
                receipt: orderId,
                notes: { orderId },
            });
            await this.prisma.order.update({
                where: { id: orderId },
                data: { razorpayOrderId: order.id },
            });
            return {
                order,
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Razorpay order creation failed: ${error.message}`);
        }
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map