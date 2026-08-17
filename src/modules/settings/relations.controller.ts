import { Controller, Get, Post, Put, Delete, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FilterConfigService } from './filter-config.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin - Relations/Recipients')
@Controller('relations')
export class RelationsController {
  constructor(private readonly filterConfigService: FilterConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get all relations/recipients' })
  async getAllRelations() {
    const relations = await this.filterConfigService.getRecipientsList();
    const mapped = relations.map((r: any) => ({
      _id: r._id,
      id: r._id,
      name: r.name,
      slug: r.slug,
      isActive: r.isActive !== undefined ? r.isActive : true,
    }));
    return {
      status: 'success',
      data: {
        relations: mapped,
        pagination: { total: mapped.length, page: 1, limit: 100, pages: 1 }
      }
    };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Create new relation/recipient' })
  async createRelation(@Body() dto: any) {
    const relation = await this.filterConfigService.addRecipient(dto);
    return { status: 'success', data: { relation } };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Update relation/recipient by ID' })
  async updateRelation(@Param('id') id: string, @Body() dto: any) {
    const relation = await this.filterConfigService.updateRecipient(id, dto);
    return { status: 'success', data: { relation } };
  }

  @Patch(':id/toggle-status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Toggle relation/recipient status' })
  async toggleRelationStatus(@Param('id') id: string) {
    const list = await this.filterConfigService.getRecipientsList();
    const found = list.find((r: any) => r._id === id);
    const active = found ? (found as any).isActive : true;
    const relation = await this.filterConfigService.updateRecipient(id, { isActive: !active });
    return { status: 'success', data: { relation } };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Delete relation/recipient by ID' })
  async deleteRelation(@Param('id') id: string) {
    await this.filterConfigService.deleteRecipient(id);
    return { status: 'success', message: 'Relation deleted successfully' };
  }
}
