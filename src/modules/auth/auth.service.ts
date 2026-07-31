import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
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

  constructor(private readonly prisma: PrismaService) {
    const config = getEnvConfig();
    this.jwtSecret = config.jwtSecret;
  }

  async register(dto: RegisterUserDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phone: dto.phone || '' }],
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

    const token = this.generateToken(user.id, user.email, user.role);

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  async login(dto: LoginUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.isDeleted || !user.isActive) {
      throw new UnauthorizedException('Invalid email credentials or account inactive.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const token = this.generateToken(user.id, user.email, user.role);

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  generateToken(userId: string, email: string, role: string): string {
    return jwt.sign({ id: userId, email, role }, this.jwtSecret, { expiresIn: '7d' });
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired authentication token.');
    }
  }
}
