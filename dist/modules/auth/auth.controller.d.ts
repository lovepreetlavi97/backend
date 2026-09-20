import { Response, Request } from 'express';
import { AuthService, RegisterUserDto, LoginUserDto } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterUserDto, res: Response): Promise<{
        status: string;
        message: string;
        data: {
            accessToken: string;
            refreshToken: string;
            user: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                isActive: boolean;
                email: string;
                phone: string | null;
                role: import(".prisma/client").$Enums.Role;
                isDeleted: boolean;
            };
        };
    }>;
    login(dto: LoginUserDto, res: Response): Promise<{
        status: string;
        message: string;
        data: {
            accessToken: string;
            refreshToken: string;
            user: any;
        };
    }>;
    refresh(req: Request, res: Response): Promise<{
        status: string;
        data: {
            accessToken: string;
        };
    }>;
    logout(req: Request, res: Response): Promise<{
        status: string;
        message: string;
    }>;
}
