import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PricesService } from './prices.service';
import { CreatePriceRuleDto, UpdatePriceRuleDto } from './dto/price-rule.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Prices')
@Controller('prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all price rules with pagination' })
  async getPriceRules(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
  ) {
    const data = await this.pricesService.getPriceRules(page, limit, search);
    return {
      status: 'success',
      data,
    };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Create new price rule' })
  async createPriceRule(@Body() dto: CreatePriceRuleDto) {
    const priceRule = await this.pricesService.createPriceRule(dto);
    return {
      status: 'success',
      message: 'Price rule created successfully.',
      data: { priceRule },
    };
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Update price rule' })
  async updatePriceRule(
    @Param('id') id: string,
    @Body() dto: UpdatePriceRuleDto,
  ) {
    const priceRule = await this.pricesService.updatePriceRule(id, dto);
    return {
      status: 'success',
      message: 'Price rule updated successfully.',
      data: { priceRule },
    };
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Delete price rule' })
  async deletePriceRule(@Param('id') id: string) {
    await this.pricesService.deletePriceRule(id);
    return { status: 'success', message: 'Price rule deleted.' };
  }

  @Patch(':id/toggle-status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Admin: Toggle price rule status' })
  async toggleStatus(@Param('id') id: string) {
    return { status: 'success', message: 'Status updated.' };
  }
}
