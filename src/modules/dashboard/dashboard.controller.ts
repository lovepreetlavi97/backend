import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Dashboard & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Admin: Get dashboard analytics metrics' })
  async getStats() {
    const stats = await this.dashboardService.getAdminAnalytics();
    return { status: 'success', data: stats };
  }
}

@ApiTags('Dashboard & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: Get dashboard counts' })
  async getCounts() {
    const data = await this.dashboardService.getCounts();
    return { status: 'success', statusCode: 200, data };
  }

  @Get('performance')
  @ApiOperation({ summary: 'Admin: Get dashboard performance stats' })
  async getPerformance() {
    const data = await this.dashboardService.getPerformance();
    return { status: 'success', statusCode: 200, data };
  }
}
