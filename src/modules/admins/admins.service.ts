import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });
  }

  async createAdmin(dto: { name: string; email: string; password: string; role?: any; permissions?: string[] }) {
    const existing = await this.prisma.admin.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Admin email already exists.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    return this.prisma.admin.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: dto.role || 'ADMIN',
        permissions: dto.permissions || [],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
    });
  }
}
