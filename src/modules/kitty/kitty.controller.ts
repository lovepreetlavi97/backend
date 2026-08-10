import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KittyService } from './kitty.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Kitty Savings')
@Controller('kitty')
export class KittyController {
  constructor(private readonly kittyService: KittyService) {}

  // ================= WEBSITE / CUSTOMER ENDPOINTS =================

  @Get('plans')
  @ApiOperation({ summary: 'Get active kitty plans' })
  async getActivePlans(
    @Query('category') category?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.kittyService.getPlans({
      category,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Post('enroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enroll in a savings plan' })
  async enrollInKitty(@CurrentUser('id') userId: string, @Body() body: { planId: string }) {
    return this.kittyService.enrollInKitty(userId, body.planId);
  }

  @Get('my-kitties')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get logged-in user's active subscriptions" })
  async getMyKitties(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.kittyService.getMyKitties(userId, {
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('my-kitties/:kittyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get specific user subscription details' })
  async getMyKittyDetails(@CurrentUser('id') userId: string, @Param('kittyId') kittyId: string) {
    return this.kittyService.getMyKittyDetails(userId, kittyId);
  }

  @Post('payment/initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate razorpay payment order for kitty monthly installment' })
  async initiateKittyPayment(@CurrentUser('id') userId: string, @Body() body: { paymentId: string }) {
    const result = await this.kittyService.initiateKittyPayment(userId, body.paymentId);
    return {
      status: 'success',
      data: result,
    };
  }

  @Post('my-kitties/:kittyId/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel/Close savings scheme subscription' })
  async cancelMyKitty(@CurrentUser('id') userId: string, @Param('kittyId') kittyId: string) {
    return this.kittyService.cancelMyKitty(userId, kittyId);
  }

  // ================= ADMIN DASHBOARD ENDPOINTS =================

  @Get('admin/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Get all savings plans' })
  async getAdminPlans() {
    return this.kittyService.getAdminPlans();
  }

  @Get('admin/plans/:planId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Get plan by ID' })
  async getPlanById(@Param('planId') planId: string) {
    return this.kittyService.getPlanById(planId);
  }

  @Post('admin/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Create new plan' })
  async createPlan(@Body() body: any) {
    return this.kittyService.createPlan(body);
  }

  @Put('admin/plans/:planId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Update plan details' })
  async updatePlan(@Param('planId') planId: string, @Body() body: any) {
    return this.kittyService.updatePlan(planId, body);
  }

  @Delete('admin/plans/:planId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Delete/deactivate plan' })
  async deletePlan(@Param('planId') planId: string) {
    return this.kittyService.deletePlan(planId);
  }

  @Get('admin/enrollments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: List user scheme enrollments' })
  async getAdminEnrollments(
    @Query('status') status?: string,
    @Query('planId') planId?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.kittyService.getAdminEnrollments({
      status,
      planId,
      userId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('admin/statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Get scheme stats' })
  async getAdminStatistics() {
    return this.kittyService.getAdminStatistics();
  }

  @Post('admin/manual-payment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Log cash or offline transfer payment' })
  async recordManualPayment(
    @Body() body: { paymentId: string; method: string; receiptId?: string; amount?: number },
  ) {
    return this.kittyService.recordManualPayment(body.paymentId, body.method, body.receiptId, body.amount);
  }

  @Get('admin/user-kitty/:kittyId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Get details of a scheme enrollment' })
  async getAdminUserKitty(@Param('kittyId') kittyId: string) {
    return this.kittyService.getSubscriptionDetails(kittyId);
  }

  @Put('admin/user-kitty/:kittyId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Update enrollment status (pause/resume/cancel)' })
  async updateUserKittyStatus(
    @Param('kittyId') kittyId: string,
    @Body() body: { status: string; reason?: string },
  ) {
    return this.kittyService.updateUserKittyStatus(kittyId, body.status, body.reason);
  }

  @Get('admin/overdue-payments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: List overdue subscriptions' })
  async getOverduePayments() {
    return this.kittyService.getOverduePayments();
  }

  @Post('admin/send-reminders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Push reminders for overdue accounts' })
  async sendPaymentReminders(@Body() body: { paymentIds: string[] }) {
    return this.kittyService.sendPaymentReminders(body.paymentIds);
  }

  @Post('admin/seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Seed dummy kitty savings plans and enrollments' })
  async seedDummy(@Body() body: { createEnrollments?: boolean; enrollmentsPerPlan?: number }) {
    return this.kittyService.seedDummy(body);
  }

  // === Standard user subscription lookup (keep existing) ===
  @Get('subscription/:id')
  @ApiOperation({ summary: 'Retrieve subscription status' })
  async getSubscriptionDetails(@Param('id') id: string) {
    return this.kittyService.getSubscriptionDetails(id);
  }
}
