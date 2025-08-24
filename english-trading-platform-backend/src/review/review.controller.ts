// src/review/review.controller.ts
import { Controller, Post, Body, Get, Param, Patch, ParseIntPipe } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto, UpdateReviewDto } from './dto';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  async create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewService.create(createReviewDto);
  }

  @Patch(':id')
  async updateReview(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewDto
  ) {
    return this.reviewService.updateReview(id, updateReviewDto);
  }

  @Patch(':id/reply')
  async replyToReview(
    @Param('id', ParseIntPipe) id: number,
    @Body('ownerReply') ownerReply: string
  ) {
    return this.reviewService.updateReview(id, { ownerReply });
  }

  @Get('owner/:ownerId')
  async findByOwner(@Param('ownerId', ParseIntPipe) ownerId: number) {
    return this.reviewService.findByOwner(ownerId);
  }
  @Get('service/:serviceId')
async findByService(@Param('serviceId', ParseIntPipe) serviceId: number) {
  return this.reviewService.findByService(serviceId);
}

}
