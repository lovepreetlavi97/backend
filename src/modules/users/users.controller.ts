import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller(['users', 'admin/users'])
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
    const profile = await this.usersService.updateProfile(userId, dto);
    return {
      status: 'success',
      message: 'Profile updated successfully.',
      data: { profile },
    };
  }

  @Get('export')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Export users' })
  async exportUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Res() res?: Response,
  ) {
    const result = await this.usersService.findAllUsers({
      page: 1,
      limit: 10000,
      search,
      role,
      status,
    });

    if (res) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=users_export_${Date.now()}.json`);
      return res.send(JSON.stringify(result.users, null, 2));
    }
    return { status: 'success', data: result };
  }

  @Get()
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Get list of all registered users with pagination & search' })
  async getAllUsers(
    @Query('page') pageStr?: string,
    @Query('limit') limitStr?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const limit = limitStr ? parseInt(limitStr, 10) : 10;
    const result = await this.usersService.findAllUsers({
      page,
      limit,
      search,
      role,
      status,
      sortBy,
      sortOrder,
    });

    return {
      status: 'success',
      data: result,
    };
  }

  @Get(':id')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Get user by ID' })
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.getProfile(id);
    return {
      status: 'success',
      data: { user },
    };
  }

  @Post()
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Create new user' })
  async createUser(@Body() dto: any) {
    const user = await this.usersService.createUser(dto);
    return {
      status: 'success',
      message: 'User created successfully.',
      data: { user },
    };
  }

  @Put(':id')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Update user by ID' })
  async updateUser(@Param('id') id: string, @Body() dto: any) {
    const user = await this.usersService.updateUser(id, dto);
    return {
      status: 'success',
      message: 'User updated successfully.',
      data: { user },
    };
  }

  @Patch(':id')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Patch user by ID' })
  async patchUser(@Param('id') id: string, @Body() dto: any) {
    const user = await this.usersService.updateUser(id, dto);
    return {
      status: 'success',
      message: 'User updated successfully.',
      data: { user },
    };
  }

  @Delete(':id')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Admin: Delete user by ID' })
  async deleteUser(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
    return {
      status: 'success',
      message: 'User deleted successfully.',
    };
  }
}

