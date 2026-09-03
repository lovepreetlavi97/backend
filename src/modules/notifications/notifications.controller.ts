import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications' })
  async getNotifications(
    @CurrentUser() user: any,
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('isRead') isReadStr?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const isRead = isReadStr !== undefined ? isReadStr === 'true' : undefined;

    const result = await this.notificationsService.getAllNotifications({ page, limit, isRead });
    return { status: 'success', data: result };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markRead(@Param('id') notificationId: string) {
    return { status: 'success', message: 'Notification marked as read.' };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markReadAll() {
    await this.notificationsService.markAllAsRead();
    return { status: 'success', message: 'All notifications marked as read.' };
  }
}

@ApiTags('Admin Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/notifications')
export class AdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: Get notifications' })
  async getNotifications(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('isRead') isReadStr?: string,
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const isRead = isReadStr !== undefined ? isReadStr === 'true' : undefined;

    const result = await this.notificationsService.getAllNotifications({ page, limit, isRead });
    return { status: 'success', data: result };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Admin: Mark notification as read' })
  async markRead(@Param('id') notificationId: string) {
    return { status: 'success', message: 'Notification marked as read.' };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Admin: Mark all notifications as read' })
  async markReadAll() {
    await this.notificationsService.markAllAsRead();
    return { status: 'success', message: 'All notifications marked as read.' };
  }
}


