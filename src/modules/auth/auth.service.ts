import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';
import { getEnvConfig } from '../../config/env.config';

export interface RegisterUserDto {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    const config = getEnvConfig();
    this.jwtSecret = config.jwtSecret;
  }

  async register(dto: RegisterUserDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: dto.phone || undefined }],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        password: hashedPassword,
        role: 'USER',
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, ...tokens };
  }

  async login(dto: LoginUserDto) {
    let account: any = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!account) {
      account = await this.prisma.admin.findUnique({
        where: { email: dto.email },
      });
    }

    if (!account || account.isDeleted || !account.isActive) {
      throw new UnauthorizedException('Invalid credentials or account disabled.');
    }

    const isMatch = await bcrypt.compare(dto.password, account.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const tokens = await this.generateTokens(account.id, account.email, account.role);

    const { password, ...userWithoutPassword } = account;
    return { user: userWithoutPassword, ...tokens };
  }

  async generateTokens(userId: string, email: string, role: string) {
    const accessToken = jwt.sign({ id: userId, email, role }, this.jwtSecret, { expiresIn: '7d' });
    const refreshToken = jwt.sign({ id: userId, email, role, type: 'refresh' }, this.jwtSecret, { expiresIn: '7d' });

    // Store active session in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt,
      },
    }).catch(() => null);

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded: any = jwt.verify(refreshToken, this.jwtSecret);
      const session = await this.prisma.session.findUnique({ where: { refreshToken } });

      if (!session || new Date() > session.expiresAt) {
        throw new UnauthorizedException('Refresh token expired or revoked.');
      }

      let user: any = await this.prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) {
        user = await this.prisma.admin.findUnique({ where: { id: decoded.id } });
      }

      if (!user || user.isDeleted || !user.isActive) {
        throw new UnauthorizedException('User account inactive.');
      }

      const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, this.jwtSecret, { expiresIn: '7d' });
      return { accessToken };
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token.');
    }
  }

  async logout(refreshToken: string, token: string) {
    if (refreshToken) {
      await this.prisma.session.deleteMany({ where: { refreshToken } }).catch(() => null);
    }
    if (token) {
      await this.redis.set(`blacklist_${token}`, 'true', 900);
    }
    return { message: 'Logged out successfully.' };
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}
