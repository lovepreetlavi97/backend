import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
export interface KittyMaturitySummary {
    subscriptionId: string;
    totalPaidMonths: number;
    totalCustomerContribution: number;
    bonusAmountAdded: number;
    finalMaturityValue: number;
    status: string;
}
export declare class KittyService {
    private readonly prisma;
    private readonly redis;
    private readonly razorpay;
    constructor(prisma: PrismaService, redis: RedisService);
    calculateMaturity(monthlyAmount: number, paidMonths: number, bonusMonths?: number): KittyMaturitySummary;
    formatPlan(plan: any): any;
    generatePaymentsSchedule(userKitty: any): any[];
    formatUserKitty(userKitty: any): {
        _id: any;
        planId: any;
        status: any;
        startDate: any;
        endDate: string;
        nextPaymentDate: any;
        monthlyAmount: number;
        totalAmount: number;
        maturityAmount: any;
        totalPaid: number;
        remainingAmount: number;
        payments: any[];
    };
    getSubscriptionDetails(userKittyId: string): Promise<{
        maturitySummary: {
            subscriptionId: string;
            totalPaidMonths: number;
            totalCustomerContribution: number;
            bonusAmountAdded: number;
            finalMaturityValue: number;
            status: string;
        };
        _id: any;
        planId: any;
        status: any;
        startDate: any;
        endDate: string;
        nextPaymentDate: any;
        monthlyAmount: number;
        totalAmount: number;
        maturityAmount: any;
        totalPaid: number;
        remainingAmount: number;
        payments: any[];
    }>;
    getPlans(params?: {
        category?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        success: boolean;
        data: {
            plans: any[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                pages: number;
            };
        };
    }>;
    getAdminPlans(): Promise<{
        success: boolean;
        data: {
            plans: any[];
        };
    }>;
    getPlanById(planId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    createPlan(data: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    updatePlan(planId: string, data: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    deletePlan(planId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    enrollInKitty(userId: string, planId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            enrollment: {
                _id: any;
                planId: any;
                status: any;
                startDate: any;
                endDate: string;
                nextPaymentDate: any;
                monthlyAmount: number;
                totalAmount: number;
                maturityAmount: any;
                totalPaid: number;
                remainingAmount: number;
                payments: any[];
            };
        };
    }>;
    getMyKitties(userId: string, params?: {
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        success: boolean;
        data: {
            _id: any;
            planId: any;
            status: any;
            startDate: any;
            endDate: string;
            nextPaymentDate: any;
            monthlyAmount: number;
            totalAmount: number;
            maturityAmount: any;
            totalPaid: number;
            remainingAmount: number;
            payments: any[];
        }[];
    }>;
    getMyKittyDetails(userId: string, kittyId: string): Promise<{
        success: boolean;
        data: {
            _id: any;
            planId: any;
            status: any;
            startDate: any;
            endDate: string;
            nextPaymentDate: any;
            monthlyAmount: number;
            totalAmount: number;
            maturityAmount: any;
            totalPaid: number;
            remainingAmount: number;
            payments: any[];
        };
    }>;
    cancelMyKitty(userId: string, kittyId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            _id: any;
            planId: any;
            status: any;
            startDate: any;
            endDate: string;
            nextPaymentDate: any;
            monthlyAmount: number;
            totalAmount: number;
            maturityAmount: any;
            totalPaid: number;
            remainingAmount: number;
            payments: any[];
        };
    }>;
    getAdminEnrollments(params?: {
        status?: string;
        planId?: string;
        userId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        success: boolean;
        data: {
            enrollments: {
                user: {
                    _id: string;
                    name: string;
                    email: string;
                    phone: string;
                };
                _id: any;
                planId: any;
                status: any;
                startDate: any;
                endDate: string;
                nextPaymentDate: any;
                monthlyAmount: number;
                totalAmount: number;
                maturityAmount: any;
                totalPaid: number;
                remainingAmount: number;
                payments: any[];
            }[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                pages: number;
            };
        };
    }>;
    getAdminStatistics(): Promise<{
        success: boolean;
        data: {
            activeSubscribers: number;
            totalCollected: number;
            growthRate: number;
            activeInstallmentsValue: number;
        };
    }>;
    recordManualPayment(paymentId: string, method: string, receiptId?: string, amount?: number): Promise<{
        success: boolean;
        message: string;
        data: {
            _id: any;
            planId: any;
            status: any;
            startDate: any;
            endDate: string;
            nextPaymentDate: any;
            monthlyAmount: number;
            totalAmount: number;
            maturityAmount: any;
            totalPaid: number;
            remainingAmount: number;
            payments: any[];
        };
    }>;
    updateUserKittyStatus(kittyId: string, status: string, reason?: string): Promise<{
        success: boolean;
        message: string;
        data: {
            _id: any;
            planId: any;
            status: any;
            startDate: any;
            endDate: string;
            nextPaymentDate: any;
            monthlyAmount: number;
            totalAmount: number;
            maturityAmount: any;
            totalPaid: number;
            remainingAmount: number;
            payments: any[];
        };
    }>;
    getOverduePayments(): Promise<{
        success: boolean;
        data: {
            user: {
                _id: string;
                name: string;
                email: string;
                phone: string;
            };
            _id: any;
            planId: any;
            status: any;
            startDate: any;
            endDate: string;
            nextPaymentDate: any;
            monthlyAmount: number;
            totalAmount: number;
            maturityAmount: any;
            totalPaid: number;
            remainingAmount: number;
            payments: any[];
        }[];
    }>;
    sendPaymentReminders(paymentIds: string[]): Promise<{
        success: boolean;
        message: string;
    }>;
    initiateKittyPayment(userId: string, paymentId: string): Promise<{
        orderId: any;
        amount: number;
        currency: string;
        keyId: string;
    }>;
    seedDummy(params?: {
        createEnrollments?: boolean;
        enrollmentsPerPlan?: number;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
