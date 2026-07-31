import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';
import { RedisService } from '../../shared/redis/redis.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (request.cookies && request.cookies.accessToken) {
      token = request.cookies.accessToken;
    }

    if (!token) {
      throw new UnauthorizedException('Authentication token missing or invalid.');
    }

    // Hardened Security: Check Redis Token Blacklist
    const isBlacklisted = await this.redisService.get(`blacklist_${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked or logged out.');
    }

    try {
      const decoded = this.authService.verifyToken(token);
      request.user = decoded;
      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired authentication token.');
    }
  }
}
