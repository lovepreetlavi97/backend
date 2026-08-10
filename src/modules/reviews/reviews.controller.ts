import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) { }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get all reviews for a product' })
  async getReviews(@Param('productId') productId: string) {
    const reviews = await this.reviewsService.getProductReviews(productId);
    return { status: 'success', data: { reviews } };
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit product review and rating' })
  async addReview(
    @CurrentUser('id') userId: string,
    @Body() dto: { productId: string; rating: number; comment?: string },
  ) {
    const review = await this.reviewsService.addReview(userId, dto.productId, dto.rating, dto.comment);
    return { status: 'success', message: 'Review submitted successfully.', data: { review } };
  }
}
