import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminsService } from './admins.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Admins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPERADMIN')
@Controller('admins')
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get()
  @ApiOperation({ summary: 'SuperAdmin: List all system administrators' })
  async getAdmins() {
    const admins = await this.adminsService.findAll();
    return { status: 'success', data: { admins } };
  }

  @Post()
  @ApiOperation({ summary: 'SuperAdmin: Create a new system administrator' })
  async createAdmin(@Body() dto: { name: string; email: string; password: string; role?: any; permissions?: string[] }) {
    const admin = await this.adminsService.createAdmin(dto);
    return { status: 'success', message: 'Admin created successfully.', data: { admin } };
  }
}
