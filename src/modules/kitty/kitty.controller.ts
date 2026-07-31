import { Controller, Get, Param } from '@nestjs/common';
import { KittyService } from './kitty.service';

@Controller('kitty')
export class KittyController {
  constructor(private readonly kittyService: KittyService) {}

  @Get('subscription/:id')
  async getSubscriptionDetails(@Param('id') id: string) {
    const subscription = await this.kittyService.getSubscriptionDetails(id);
    return {
      status: 'success',
      data: { subscription },
    };
  }
}
