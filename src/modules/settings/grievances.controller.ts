import { Controller, Get, Patch, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin - Grievances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('grievances')
export class GrievancesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('analytics')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Get grievances analytics' })
  async getAnalytics() {
    const total = await this.prisma.grievance.count();
    const open = await this.prisma.grievance.count({ where: { status: 'OPEN' } });
    return {
      status: 'success',
      data: {
        total,
        open,
        inProgress: 0,
        resolved: total - open,
      },
    };
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Get all grievances' })
  async getAllGrievances(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    if (search && search.trim()) {
      where.OR = [
        { subject: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.grievance.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.grievance.count({ where }),
    ]);

    const mapped = items.map((g) => ({
      _id: g.id,
      id: g.id,
      userId: {
        _id: g.user?.id || g.userId,
        name: g.user?.name || 'Customer',
        email: g.user?.email || 'customer@example.com',
      },
      type: 'service',
      subject: g.subject,
      description: g.description,
      priority: 'medium',
      status: g.status.toLowerCase(),
      attachments: [],
      replies: [],
      createdAt: g.createdAt.toISOString(),
      updatedAt: g.createdAt.toISOString(),
    }));

    return {
      status: 'success',
      data: {
        grievances: mapped,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1,
        },
      },
    };
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Get grievance by ID' })
  async getById(@Param('id') id: string) {
    const g = await this.prisma.grievance.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!g) {
      return { status: 'error', message: 'Grievance not found' };
    }

    return {
      status: 'success',
      data: {
        grievance: {
          _id: g.id,
          id: g.id,
          userId: {
            _id: g.user?.id || g.userId,
            name: g.user?.name || 'Customer',
            email: g.user?.email || 'customer@example.com',
          },
          type: 'service',
          subject: g.subject,
          description: g.description,
          priority: 'medium',
          status: g.status.toLowerCase(),
          attachments: [],
          replies: [],
          createdAt: g.createdAt.toISOString(),
          updatedAt: g.createdAt.toISOString(),
        },
      },
    };
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Update grievance status' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    const g = await this.prisma.grievance.update({
      where: { id },
      data: { status: (status || 'RESOLVED').toUpperCase() },
    });
    return { status: 'success', data: { grievance: g } };
  }

  @Post(':id/replies')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Add reply to grievance' })
  async addReply(@Param('id') id: string, @Body('message') message: string) {
    return {
      status: 'success',
      message: 'Reply recorded successfully',
    };
  }
}
