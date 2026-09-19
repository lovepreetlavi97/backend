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
                role: import(".prisma/client").$Enums.Role;
                name: string;
                isActive: boolean;
                id: string;
                email: string;
                phone: string | null;
                isDeleted: boolean;
                createdAt: Date;
                updatedAt: Date;
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
