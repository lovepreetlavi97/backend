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
  phoneNumber?: string;
  countryCode?: string;
  password?: string;
  subscribe?: boolean;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface PhoneOtpDto {
  countryCode?: string;
  phoneNumber?: string;
  phone?: string;
}

export interface VerifyOtpDto {
  countryCode?: string;
  phoneNumber?: string;
  phone?: string;
  otp: string;
}

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly otpCache: Map<string, string> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    const config = getEnvConfig();
    this.jwtSecret = config.jwtSecret;
  }

  private normalizePhone(countryCode?: string, phoneNumber?: string, rawPhone?: string): { fullPhone: string; digitsOnly: string } {
    let raw = (rawPhone || phoneNumber || '').trim();
    const code = (countryCode || '').trim();
    if (code && !raw.startsWith('+') && !raw.startsWith(code.replace('+', ''))) {
      raw = `${code}${raw}`;
    }
    if (!raw.startsWith('+')) {
      raw = `+${raw.replace(/^[^\d]+/, '')}`;
    }
    const digitsOnly = raw.replace(/[^\d]/g, '');
    return { fullPhone: raw, digitsOnly };
  }

  async requestPhoneOtp(dto: PhoneOtpDto) {
    const { fullPhone, digitsOnly } = this.normalizePhone(dto.countryCode, dto.phoneNumber, dto.phone);
    const otp = '1111'; // 4-digit OTP as specified

    await this.redis.set(`otp:${digitsOnly}`, otp, 300).catch(() => null);
    if (fullPhone) {
      await this.redis.set(`otp:${fullPhone}`, otp, 300).catch(() => null);
    }
    this.otpCache.set(digitsOnly, otp);
    if (fullPhone) this.otpCache.set(fullPhone, otp);

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(fullPhone ? [{ phone: fullPhone }] : []),
          ...(digitsOnly ? [{ phone: digitsOnly }, { phone: { endsWith: digitsOnly.slice(-10) } }] : []),
        ],
      },
    });

    const isRegistered = !!existingUser;
    return {
      userRegistered: isRegistered,
    };
  }

  async resendPhoneOtp(dto: PhoneOtpDto) {
    return this.requestPhoneOtp(dto);
  }

  async verifyPhoneOtp(dto: VerifyOtpDto) {
    const { fullPhone, digitsOnly } = this.normalizePhone(dto.countryCode, dto.phoneNumber, dto.phone);

    const cachedRedis = (await this.redis.get<string>(`otp:${digitsOnly}`).catch(() => null)) ||
      (fullPhone ? await this.redis.get<string>(`otp:${fullPhone}`).catch(() => null) : null);
    const cachedMem = this.otpCache.get(digitsOnly) || (fullPhone ? this.otpCache.get(fullPhone) : null);

    const isValid = dto.otp === '1111' || dto.otp === cachedRedis || dto.otp === cachedMem;

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP.');
    }

    // Clean up OTP
    await this.redis.del(`otp:${digitsOnly}`).catch(() => null);
    if (fullPhone) await this.redis.del(`otp:${fullPhone}`).catch(() => null);
    this.otpCache.delete(digitsOnly);
    if (fullPhone) this.otpCache.delete(fullPhone);

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(fullPhone ? [{ phone: fullPhone }] : []),
          ...(digitsOnly ? [{ phone: digitsOnly }, { phone: { endsWith: digitsOnly.slice(-10) } }] : []),
        ],
      },
    });

    if (!user) {
      const defaultPassword = await bcrypt.hash(`otp_user_${Date.now()}`, 10);
      const phoneToSave = fullPhone || digitsOnly;
      const placeholderEmail = `user_${digitsOnly || Date.now()}@gurujewellers.in`;

      user = await this.prisma.user.create({
        data: {
          name: `User ${digitsOnly.slice(-4) || 'Guest'}`,
          email: placeholderEmail,
          phone: phoneToSave,
          password: defaultPassword,
          role: 'USER',
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token: tokens.accessToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async register(dto: RegisterUserDto) {
    const { fullPhone, digitsOnly } = this.normalizePhone(dto.countryCode, dto.phoneNumber, dto.phone);

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          ...(fullPhone ? [{ phone: fullPhone }] : []),
          ...(digitsOnly ? [{ phone: digitsOnly }, { phone: { endsWith: digitsOnly.slice(-10) } }] : []),
        ],
      },
    });

    if (existingUser) {
      // If user exists by phone/email, update profile if needed
      const updateData: any = {};
      if (dto.name && !existingUser.name) updateData.name = dto.name;
      if (fullPhone && !existingUser.phone) updateData.phone = fullPhone;

      const updated = Object.keys(updateData).length > 0
        ? await this.prisma.user.update({ where: { id: existingUser.id }, data: updateData })
        : existingUser;

      const tokens = await this.generateTokens(updated.id, updated.email, updated.role);
      const { password, ...userWithoutPassword } = updated;
      return { user: userWithoutPassword, token: tokens.accessToken, ...tokens };
    }

    const rawPassword = dto.password || `pass_${Date.now()}`;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name || `User ${digitsOnly.slice(-4) || ''}`,
        email: dto.email,
        phone: fullPhone || (digitsOnly ? `+${digitsOnly}` : null),
        password: hashedPassword,
        role: 'USER',
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const { password, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token: tokens.accessToken, ...tokens };
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
    return { user: userWithoutPassword, token: tokens.accessToken, ...tokens };
  }

  async googleLogin(code: string) {
    const placeholderEmail = `google_${Date.now()}@gurujewellers.in`;
    let user = await this.prisma.user.findFirst({ where: { email: placeholderEmail } });

    if (!user) {
      const defaultPassword = await bcrypt.hash(`google_${Date.now()}`, 10);
      user = await this.prisma.user.create({
        data: {
          name: 'Google User',
          email: placeholderEmail,
          password: defaultPassword,
          role: 'USER',
        },
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token: tokens.accessToken, ...tokens };
  }

  async generateTokens(userId: string, email: string, role: string) {
    const accessToken = jwt.sign({ id: userId, email, role }, this.jwtSecret, { expiresIn: '7d' });
    const refreshToken = jwt.sign({ id: userId, email, role, type: 'refresh' }, this.jwtSecret, { expiresIn: '30d' });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const adminAccount = await this.prisma.admin.findUnique({ where: { id: userId } }).catch(() => null);
    const isActuallyAdminTable = !!adminAccount;

    await this.prisma.session.create({
      data: {
        userId: !isActuallyAdminTable ? userId : null,
        adminId: isActuallyAdminTable ? userId : null,
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

      const accessToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, this.jwtSecret, { expiresIn: '15m' });
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
      try {
        const decoded: any = jwt.decode(token);
        const now = Math.floor(Date.now() / 1000);
        const ttl = decoded && decoded.exp ? Math.max(decoded.exp - now, 0) : 900;
        if (ttl > 0) {
          await this.redis.set(`blacklist_${token}`, 'true', ttl);
        }
      } catch {
        await this.redis.set(`blacklist_${token}`, 'true', 900);
      }
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

