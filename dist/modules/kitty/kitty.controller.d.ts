import { KittyService } from './kitty.service';
export declare class KittyController {
    private readonly kittyService;
    constructor(kittyService: KittyService);
    getActivePlans(category?: string, page?: string, limit?: string): Promise<{
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
    enrollInKitty(userId: string, body: {
        planId: string;
    }): Promise<{
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
    getMyKitties(userId: string, status?: string, page?: string, limit?: string): Promise<{
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
    initiateKittyPayment(userId: string, body: {
        paymentId: string;
    }): Promise<{
        status: string;
        data: {
            orderId: any;
            amount: number;
            currency: string;
            keyId: string;
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
    createPlan(body: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    updatePlan(planId: string, body: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    deletePlan(planId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAdminEnrollments(status?: string, planId?: string, userId?: string, page?: string, limit?: string): Promise<{
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
    recordManualPayment(body: {
        paymentId: string;
        method: string;
        receiptId?: string;
        amount?: number;
    }): Promise<{
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
    getAdminUserKitty(kittyId: string): Promise<{
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
    updateUserKittyStatus(kittyId: string, body: {
        status: string;
        reason?: string;
    }): Promise<{
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
    sendPaymentReminders(body: {
        paymentIds: string[];
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    seedDummy(body: {
        createEnrollments?: boolean;
        enrollmentsPerPlan?: number;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getSubscriptionDetails(id: string): Promise<{
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
}
