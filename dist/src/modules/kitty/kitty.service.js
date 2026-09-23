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
exports.KittyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../../shared/redis/redis.service");
const client_1 = require("@prisma/client");
const Razorpay = require("razorpay");
const env_config_1 = require("../../config/env.config");
let KittyService = class KittyService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        const config = (0, env_config_1.getEnvConfig)();
        this.razorpay = new Razorpay({
            key_id: config.razorpayKeyId,
            key_secret: config.razorpayKeySecret,
        });
    }
    calculateMaturity(monthlyAmount, paidMonths, bonusMonths = 1.0) {
        const totalCustomerContribution = paidMonths * monthlyAmount;
        const bonusAmountAdded = monthlyAmount * bonusMonths;
        const finalMaturityValue = totalCustomerContribution + bonusAmountAdded;
        return {
            subscriptionId: '',
            totalPaidMonths: paidMonths,
            totalCustomerContribution,
            bonusAmountAdded,
            finalMaturityValue,
            status: paidMonths >= 11 ? 'MATURED' : 'ACTIVE',
        };
    }
    formatPlan(plan) {
        const monthlyAmount = Number(plan.monthlyAmount);
        const duration = plan.totalMonths;
        const totalAmount = duration * monthlyAmount;
        const bonusAmount = monthlyAmount * Number(plan.bonusMonths);
        const maturityAmount = totalAmount + bonusAmount;
        return {
            ...plan,
            _id: plan.id,
            duration,
            monthlyAmount,
            totalAmount,
            maturityAmount,
            category: plan.metalType.toLowerCase(),
            benefits: plan.benefits || [],
            terms: plan.terms || [],
        };
    }
    generatePaymentsSchedule(userKitty) {
        const payments = [];
        const monthlyAmount = Number(userKitty.plan.monthlyAmount);
        const totalMonths = userKitty.plan.totalMonths;
        const paidMonths = userKitty.paidMonths;
        const startDate = new Date(userKitty.createdAt);
        for (let i = 0; i < totalMonths; i++) {
            const dueDate = new Date(startDate);
            dueDate.setMonth(startDate.getMonth() + i);
            let status = 'pending';
            let paymentDate = null;
            if (i < paidMonths) {
                status = 'paid';
                const payDate = new Date(dueDate);
                payDate.setDate(payDate.getDate() + 1);
                paymentDate = payDate.toISOString();
            }
            else if (i === paidMonths) {
                const now = new Date();
                if (now > new Date(userKitty.nextDueDate)) {
                    status = 'overdue';
                }
                else {
                    status = 'pending';
                }
            }
            else {
                status = 'pending';
            }
            payments.push({
                _id: `${userKitty.id}_${i}`,
                amount: monthlyAmount,
                dueDate: dueDate.toISOString(),
                paymentDate,
                status,
                razorpayOrderId: i < paidMonths ? 'mock_order_id' : null,
            });
        }
        return payments;
    }
    formatUserKitty(userKitty) {
        const monthlyAmount = Number(userKitty.plan.monthlyAmount);
        const totalAmount = userKitty.plan.totalMonths * monthlyAmount;
        const totalPaid = Number(userKitty.totalAccumulated);
        const formattedPlan = this.formatPlan(userKitty.plan);
        return {
            _id: userKitty.id,
            planId: formattedPlan,
            status: userKitty.status.toLowerCase(),
            startDate: userKitty.createdAt.toISOString(),
            endDate: new Date(new Date(userKitty.createdAt).setMonth(userKitty.createdAt.getMonth() + userKitty.plan.totalMonths)).toISOString(),
            nextPaymentDate: userKitty.nextDueDate.toISOString(),
            monthlyAmount,
            totalAmount,
            maturityAmount: formattedPlan.maturityAmount,
            totalPaid,
            remainingAmount: totalAmount - totalPaid,
            payments: this.generatePaymentsSchedule(userKitty),
        };
    }
    async getSubscriptionDetails(userKittyId) {
        const userKitty = await this.prisma.userKitty.findUnique({
            where: { id: userKittyId },
            include: { plan: true, user: true },
        });
        if (!userKitty) {
            throw new common_1.NotFoundException(`Kitty subscription '${userKittyId}' not found.`);
        }
        const monthlyAmount = Number(userKitty.plan.monthlyAmount);
        const bonusMonths = Number(userKitty.plan.bonusMonths);
        const maturity = this.calculateMaturity(monthlyAmount, userKitty.paidMonths, bonusMonths);
        return {
            ...this.formatUserKitty(userKitty),
            maturitySummary: {
                ...maturity,
                subscriptionId: userKitty.id,
            },
        };
    }
    async getPlans(params) {
        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const skip = (page - 1) * limit;
        const where = { isActive: true };
        if (params?.category) {
            where.metalType = params.category.toUpperCase();
        }
        const [plans, total] = await Promise.all([
            this.prisma.kittyPlan.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.kittyPlan.count({ where }),
        ]);
        const formattedPlans = plans.map((p) => this.formatPlan(p));
        return {
            success: true,
            data: {
                plans: formattedPlans,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                },
            },
        };
    }
    async getAdminPlans() {
        const plans = await this.prisma.kittyPlan.findMany({
            orderBy: { createdAt: 'desc' },
        });
        const formattedPlans = plans.map((p) => this.formatPlan(p));
        return {
            success: true,
            data: {
                plans: formattedPlans,
            },
        };
    }
    async getPlanById(planId) {
        const plan = await this.prisma.kittyPlan.findUnique({
            where: { id: planId },
        });
        if (!plan) {
            throw new common_1.NotFoundException(`Kitty plan not found.`);
        }
        return {
            success: true,
            data: this.formatPlan(plan),
        };
    }
    async createPlan(data) {
        const metalType = data.category.toUpperCase();
        const duration = parseInt(data.duration, 10) || 11;
        const monthlyAmount = parseFloat(data.monthlyAmount);
        const plan = await this.prisma.kittyPlan.create({
            data: {
                name: data.name,
                description: data.description,
                totalMonths: duration,
                monthlyAmount,
                metalType,
                bonusMonths: 1.0,
                isActive: true,
            },
        });
        return {
            success: true,
            message: 'Plan created successfully.',
            data: this.formatPlan(plan),
        };
    }
    async updatePlan(planId, data) {
        const updateData = {};
        if (data.name)
            updateData.name = data.name;
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.duration)
            updateData.totalMonths = parseInt(data.duration, 10);
        if (data.monthlyAmount)
            updateData.monthlyAmount = parseFloat(data.monthlyAmount);
        if (data.category)
            updateData.metalType = data.category.toUpperCase();
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        const plan = await this.prisma.kittyPlan.update({
            where: { id: planId },
            data: updateData,
        });
        return {
            success: true,
            message: 'Plan updated successfully.',
            data: this.formatPlan(plan),
        };
    }
    async deletePlan(planId) {
        await this.prisma.kittyPlan.delete({
            where: { id: planId },
        });
        return {
            success: true,
            message: 'Plan deleted successfully.',
        };
    }
    async enrollInKitty(userId, planId) {
        const plan = await this.prisma.kittyPlan.findUnique({
            where: { id: planId },
        });
        if (!plan || !plan.isActive) {
            throw new common_1.NotFoundException(`Plan '${planId}' not found or inactive.`);
        }
        const nextDueDate = new Date();
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
        const userKitty = await this.prisma.userKitty.create({
            data: {
                userId,
                planId,
                paidMonths: 0,
                totalAccumulated: 0.00,
                status: 'ACTIVE',
                nextDueDate,
            },
            include: { plan: true },
        });
        return {
            success: true,
            message: 'Enrolled in kitty plan successfully.',
            data: {
                enrollment: this.formatUserKitty(userKitty),
            },
        };
    }
    async getMyKitties(userId, params) {
        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (params?.status) {
            where.status = params.status.toUpperCase();
        }
        const [kitties, total] = await Promise.all([
            this.prisma.userKitty.findMany({
                where,
                include: { plan: true },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.userKitty.count({ where }),
        ]);
        const formattedKitties = kitties.map((k) => this.formatUserKitty(k));
        return {
            success: true,
            data: formattedKitties,
        };
    }
    async getMyKittyDetails(userId, kittyId) {
        const userKitty = await this.prisma.userKitty.findUnique({
            where: { id: kittyId },
            include: { plan: true },
        });
        if (!userKitty || userKitty.userId !== userId) {
            throw new common_1.NotFoundException(`Kitty subscription not found.`);
        }
        return {
            success: true,
            data: this.formatUserKitty(userKitty),
        };
    }
    async cancelMyKitty(userId, kittyId) {
        const userKitty = await this.prisma.userKitty.findUnique({
            where: { id: kittyId },
        });
        if (!userKitty || userKitty.userId !== userId) {
            throw new common_1.NotFoundException(`Kitty subscription not found.`);
        }
        const updated = await this.prisma.userKitty.update({
            where: { id: kittyId },
            data: { status: 'CANCELLED' },
            include: { plan: true },
        });
        return {
            success: true,
            message: 'Kitty subscription cancelled successfully.',
            data: this.formatUserKitty(updated),
        };
    }
    async getAdminEnrollments(params) {
        const page = params?.page || 1;
        const limit = params?.limit || 10;
        const skip = (page - 1) * limit;
        const where = {};
        if (params?.status) {
            where.status = params.status.toUpperCase();
        }
        if (params?.planId) {
            where.planId = params.planId;
        }
        if (params?.userId) {
            where.userId = params.userId;
        }
        const [enrollments, total] = await Promise.all([
            this.prisma.userKitty.findMany({
                where,
                include: { plan: true, user: true },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.userKitty.count({ where }),
        ]);
        const formattedEnrollments = enrollments.map((e) => ({
            ...this.formatUserKitty(e),
            user: {
                _id: e.user.id,
                name: e.user.name,
                email: e.user.email,
                phone: e.user.phone,
            },
        }));
        return {
            success: true,
            data: {
                enrollments: formattedEnrollments,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                },
            },
        };
    }
    async getAdminStatistics() {
        const totalUsersActive = await this.prisma.userKitty.count({
            where: { status: 'ACTIVE' },
        });
        const totalCollectedObj = await this.prisma.userKitty.aggregate({
            _sum: { totalAccumulated: true },
        });
        const totalCollected = Number(totalCollectedObj._sum.totalAccumulated || 0);
        return {
            success: true,
            data: {
                activeSubscribers: totalUsersActive,
                totalCollected,
                growthRate: 12.5,
                activeInstallmentsValue: totalUsersActive * 5000,
            },
        };
    }
    async recordManualPayment(paymentId, method, receiptId, amount) {
        const parts = paymentId.split('_');
        const userKittyId = parts[0];
        const installmentIndex = parseInt(parts[1], 10);
        const userKitty = await this.prisma.userKitty.findUnique({
            where: { id: userKittyId },
            include: { plan: true },
        });
        if (!userKitty) {
            throw new common_1.NotFoundException(`Kitty subscription not found.`);
        }
        if (userKitty.paidMonths > installmentIndex) {
            return {
                success: true,
                message: 'Installment already paid.',
                data: this.formatUserKitty(userKitty),
            };
        }
        const payAmount = amount || Number(userKitty.plan.monthlyAmount);
        const newPaidMonths = userKitty.paidMonths + 1;
        const totalMonths = userKitty.plan.totalMonths;
        const isCompleted = newPaidMonths >= totalMonths;
        const newStatus = isCompleted ? 'COMPLETED' : 'ACTIVE';
        const currentDueDate = new Date(userKitty.nextDueDate);
        const nextDueDate = new Date(currentDueDate.setMonth(currentDueDate.getMonth() + 1));
        const updated = await this.prisma.userKitty.update({
            where: { id: userKittyId },
            data: {
                paidMonths: newPaidMonths,
                totalAccumulated: { increment: payAmount },
                status: newStatus,
                nextDueDate,
            },
            include: { plan: true },
        });
        await this.prisma.transaction.create({
            data: {
                paymentId: receiptId || `MANUAL-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                amount: payAmount,
                currency: 'INR',
                status: 'PAID',
                gatewayResponse: { method, recordType: 'manual', paymentId, installmentIndex },
            },
        });
        return {
            success: true,
            message: 'Manual payment recorded successfully.',
            data: this.formatUserKitty(updated),
        };
    }
    async updateUserKittyStatus(kittyId, status, reason) {
        const userKitty = await this.prisma.userKitty.findUnique({
            where: { id: kittyId },
        });
        if (!userKitty) {
            throw new common_1.NotFoundException(`Kitty subscription not found.`);
        }
        const updated = await this.prisma.userKitty.update({
            where: { id: kittyId },
            data: { status: status.toUpperCase() },
            include: { plan: true },
        });
        return {
            success: true,
            message: `Kitty subscription status updated to ${status}.`,
            data: this.formatUserKitty(updated),
        };
    }
    async getOverduePayments() {
        const now = new Date();
        const overdueKitties = await this.prisma.userKitty.findMany({
            where: {
                status: 'ACTIVE',
                nextDueDate: { lt: now },
            },
            include: { plan: true, user: true },
        });
        const formatted = overdueKitties.map((ok) => ({
            ...this.formatUserKitty(ok),
            user: {
                _id: ok.user.id,
                name: ok.user.name,
                email: ok.user.email,
                phone: ok.user.phone,
            },
        }));
        return {
            success: true,
            data: formatted,
        };
    }
    async sendPaymentReminders(paymentIds) {
        console.log(`Sending reminders for installments: ${paymentIds.join(', ')}`);
        return {
            success: true,
            message: `${paymentIds.length} payment reminders queued successfully.`,
        };
    }
    async initiateKittyPayment(userId, paymentId) {
        const parts = paymentId.split('_');
        if (parts.length < 2) {
            throw new common_1.BadRequestException('Invalid payment ID format.');
        }
        const userKittyId = parts[0];
        const installmentIndex = parseInt(parts[1], 10);
        const userKitty = await this.prisma.userKitty.findUnique({
            where: { id: userKittyId },
            include: { plan: true },
        });
        if (!userKitty) {
            throw new common_1.NotFoundException(`Kitty subscription not found.`);
        }
        if (userKitty.userId !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to pay for this kitty.');
        }
        const monthlyAmount = Number(userKitty.plan.monthlyAmount);
        const order = await this.razorpay.orders.create({
            amount: Math.round(monthlyAmount * 100),
            currency: 'INR',
            receipt: paymentId,
            notes: { userKittyId, installmentIndex },
        });
        await this.redis.set(`pending-kitty-payment:${order.id}`, { userKittyId, installmentIndex }, 3600);
        return {
            orderId: order.id,
            amount: monthlyAmount,
            currency: 'INR',
            keyId: (0, env_config_1.getEnvConfig)().razorpayKeyId,
        };
    }
    async seedDummy(params) {
        const planData = [
            {
                name: 'Swarna Savings 11-Month Gold Plan',
                totalMonths: 11,
                monthlyAmount: 5000.00,
                bonusMonths: 1.0,
                metalType: client_1.MetalType.GOLD,
                description: 'Pay 11 monthly installments and get 100% bonus month contribution on maturity!',
                isActive: true,
            },
            {
                name: 'Rajat Savings 11-Month Silver Plan',
                totalMonths: 11,
                monthlyAmount: 2000.00,
                bonusMonths: 1.0,
                metalType: client_1.MetalType.SILVER,
                description: 'Pay 11 monthly installments and get 100% bonus month contribution on maturity!',
                isActive: true,
            },
            {
                name: 'Heera Savings 11-Month Diamond Plan',
                totalMonths: 11,
                monthlyAmount: 10000.00,
                bonusMonths: 1.0,
                metalType: client_1.MetalType.GOLD,
                description: 'Pay 11 monthly installments and get 100% bonus month contribution on maturity!',
                isActive: true,
            }
        ];
        const plans = [];
        for (const data of planData) {
            let plan = await this.prisma.kittyPlan.findFirst({
                where: { name: data.name },
            });
            if (!plan) {
                plan = await this.prisma.kittyPlan.create({
                    data,
                });
            }
            plans.push(plan);
        }
        if (params?.createEnrollments) {
            let user = await this.prisma.user.findFirst({
                where: { email: 'dummy.customer@example.com' },
            });
            if (!user) {
                const hashedPassword = await require('bcryptjs').hash('UserPassword@2026', 10);
                user = await this.prisma.user.create({
                    data: {
                        name: 'Dummy Customer',
                        email: 'dummy.customer@example.com',
                        phone: '+918888888888',
                        password: hashedPassword,
                        role: 'USER',
                        isActive: true,
                    },
                });
            }
            const count = params.enrollmentsPerPlan || 1;
            for (const plan of plans) {
                const existing = await this.prisma.userKitty.findFirst({
                    where: { userId: user.id, planId: plan.id },
                });
                if (!existing) {
                    for (let i = 0; i < count; i++) {
                        const nextDueDate = new Date();
                        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
                        await this.prisma.userKitty.create({
                            data: {
                                userId: user.id,
                                planId: plan.id,
                                paidMonths: 2,
                                totalAccumulated: Number(plan.monthlyAmount) * 2,
                                status: 'ACTIVE',
                                nextDueDate,
                            },
                        });
                    }
                }
            }
        }
        return {
            success: true,
            message: 'Dummy kitty data seeded successfully.',
        };
    }
};
exports.KittyService = KittyService;
exports.KittyService = KittyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], KittyService);
//# sourceMappingURL=kitty.service.js.map