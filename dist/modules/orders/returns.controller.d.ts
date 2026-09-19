import { OrdersService } from './orders.service';
export declare class ReturnsController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    getAllReturns(pageStr?: string, limitStr?: string, search?: string): Promise<{
        status: string;
        data: {
            returns: {
                _id: any;
                id: any;
                orderId: {
                    _id: any;
                    orderNumber: any;
                };
                userId: {
                    _id: any;
                    name: any;
                    email: any;
                };
                products: any;
                returnReason: string;
                returnStatus: string;
                refundAmount: any;
                refundStatus: string;
                refundMethod: string;
                trackingNumber: string;
                adminNotes: string;
                createdAt: any;
                updatedAt: any;
            }[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                pages: number;
            };
        };
    }>;
    getReturnById(id: string): Promise<{
        status: string;
        data: {
            return: {
                _id: any;
                id: any;
                orderId: {
                    _id: any;
                    orderNumber: any;
                };
                userId: {
                    _id: any;
                    name: any;
                    email: any;
                };
                products: any;
                returnReason: string;
                returnStatus: string;
                refundAmount: number;
                refundStatus: string;
                refundMethod: string;
                trackingNumber: string;
                adminNotes: string;
                createdAt: any;
                updatedAt: any;
            };
        };
    }>;
    processRefund(id: string): Promise<{
        status: string;
        message: string;
    }>;
    updateReturnStatus(id: string, status: string): Promise<{
        status: string;
        message: string;
    }>;
}
