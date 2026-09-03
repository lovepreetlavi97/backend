import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private mapUser(u: any) {
    return {
      _id: u.id,
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      phoneNumber: u.phone || '',
      role: u.role,
      status: u.isActive ? 'active' : 'inactive',
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User profile not found.');
    }

    return this.mapUser(user);
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return this.mapUser(updated);
  }

  async findAllUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Math.max(1, Number(params?.page || 1));
    const limit = Math.max(1, Number(params?.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };

    if (params?.role && params.role !== 'all') {
      const normalizedRole = params.role.toUpperCase().replace(/\s+/g, '');
      if (['USER', 'ADMIN', 'SUPERADMIN', 'VENDOR'].includes(normalizedRole)) {
        where.role = normalizedRole;
      }
    }

    if (params?.status && params.status !== 'all') {
      if (params.status === 'active') where.isActive = true;
      else if (params.status === 'inactive') where.isActive = false;
    }

    if (params?.search && params.search.trim()) {
      const s = params.search.trim();
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } },
      ];
    }

    const orderByField = params?.sortBy || 'createdAt';
    const orderDirection = params?.sortOrder || 'desc';

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: [{ [orderByField]: orderDirection }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => this.mapUser(u)),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async createUser(dto: {
    name: string;
    email: string;
    password?: string;
    role?: string;
    status?: string;
    phone?: string;
  }) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, ...(dto.phone ? [{ phone: dto.phone }] : [])],
      },
    });

    if (existing) {
      throw new ConflictException('User with this email or phone already exists.');
    }

    const rawPassword = dto.password || 'GuruGold@123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const roleNormalized = (dto.role || 'USER').toUpperCase().replace(/\s+/g, '') as any;
    const role = ['USER', 'ADMIN', 'SUPERADMIN', 'VENDOR'].includes(roleNormalized) ? roleNormalized : 'USER';
    const isActive = dto.status !== 'inactive';

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone || null,
        password: hashedPassword,
        role,
        isActive,
      },
    });

    return this.mapUser(user);
  }

  async updateUser(
    id: string,
    dto: {
      name?: string;
      email?: string;
      phone?: string;
      role?: string;
      status?: string;
      password?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.isDeleted) {
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone || null;
    if (dto.role !== undefined) {
      const roleNormalized = dto.role.toUpperCase().replace(/\s+/g, '') as any;
      if (['USER', 'ADMIN', 'SUPERADMIN', 'VENDOR'].includes(roleNormalized)) {
        data.role = roleNormalized;
      }
    }
    if (dto.status !== undefined) {
      data.isActive = dto.status === 'active';
    }
    if (dto.password && dto.password.trim().length > 0) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    return this.mapUser(updated);
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.isDeleted) {
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }

    await this.prisma.user.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });

    return { success: true };
  }
}

