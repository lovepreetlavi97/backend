import { PrismaService } from '../prisma/prisma.service';
export declare class EmailService {
    private readonly prisma;
    private transporter;
    private readonly logger;
    constructor(prisma: PrismaService);
    sendOrderConfirmationEmail(order: any, email: string): Promise<void>;
}
