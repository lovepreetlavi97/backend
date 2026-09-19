import { PrismaService } from '../prisma/prisma.service';
export declare class GrievancesController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAnalytics(): Promise<{
        status: string;
        data: {
            total: number;
            open: number;
            inProgress: number;
            resolved: number;
        };
    }>;
    getAllGrievances(pageStr?: string, limitStr?: string, search?: string, status?: string): Promise<{
        status: string;
        data: {
            grievances: {
                _id: string;
                id: string;
                userId: {
                    _id: string;
                    name: string;
                    email: string;
                };
                type: string;
                subject: string;
                description: string;
                priority: string;
                status: string;
                attachments: any[];
                replies: any[];
                createdAt: string;
                updatedAt: string;
            }[];
            pagination: {
                total: number;
                page: number;
                limit: number;
                pages: number;
            };
        };
    }>;
    getById(id: string): Promise<{
        status: string;
        message: string;
        data?: undefined;
    } | {
        status: string;
        data: {
            grievance: {
                _id: string;
                id: string;
                userId: {
                    _id: string;
                    name: string;
                    email: string;
                };
                type: string;
                subject: string;
                description: string;
                priority: string;
                status: string;
                attachments: any[];
                replies: any[];
                createdAt: string;
                updatedAt: string;
            };
        };
        message?: undefined;
    }>;
    updateStatus(id: string, status: string): Promise<{
        status: string;
        data: {
            grievance: {
                description: string;
                id: string;
                createdAt: Date;
                userId: string;
                status: string;
                subject: string;
            };
        };
    }>;
    addReply(id: string, message: string): Promise<{
        status: string;
        message: string;
    }>;
}
