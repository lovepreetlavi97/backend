import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MetalsService } from './metals.service';
import { CreateMetalDto, UpdateMetalDto } from './dto/metal.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Metals')
@Controller('metals')
export class MetalsController {
  constructor(private readonly metalsService: MetalsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all metals' })
  async getMetals() {
    const metals = await this.metalsService.getMetals();
    return {
      status: 'success',
      data: { metals },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single metal by ID' })
  async getMetal(@Param('id') id: string) {
    const metal = await this.metalsService.getMetal(id);
    return { metal };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Create new metal' })
  async createMetal(@Body() dto: CreateMetalDto) {
    const metal = await this.metalsService.createMetal(dto);
    return { metal };
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Update metal' })
  async updateMetal(@Param('id') id: string, @Body() dto: UpdateMetalDto) {
    const metal = await this.metalsService.updateMetal(id, dto);
    return { metal };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Delete metal' })
  async deleteMetal(@Param('id') id: string) {
    await this.metalsService.deleteMetal(id);
    return {
      status: 'success',
      message: 'Metal deleted successfully.',
    };
  }

  @Patch(':id/position')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Update metal position' })
  async updatePosition(@Param('id') id: string, @Body() dto: { direction: 'up' | 'down' }) {
    return {
      status: 'success',
      message: 'Position updated successfully.',
    };
  }
}
