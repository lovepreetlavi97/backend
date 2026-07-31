import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  async getProfile(@CurrentUser('id') userId: string) {
    const profile = await this.usersService.getProfile(userId);
    return {
      status: 'success',
      data: { profile },
    };
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update customer profile information' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: { name?: string; phone?: string },
  ) {
    const updated = await this.usersService.updateProfile(userId, dto);
    return {
      status: 'success',
      message: 'Profile updated successfully.',
      data: { profile: updated },
    };
  }

  @Get()
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Get list of all registered users' })
  async getAllUsers() {
    const users = await this.usersService.findAllUsers();
    return {
      status: 'success',
      data: { users },
    };
  }
}
