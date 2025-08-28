// src/review/review.controller.ts
import { Controller, Post, Body, Get, Param, Patch, ParseIntPipe, Query } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto, QueryReviewDto, UpdateReviewDto } from './dto';

// src/review/review.controller.ts (đổi routes)
@Controller('reviews')
export class ReviewController {
  constructor(private readonly srv: ReviewService) {}

  @Post()
  create(@Body() dto: CreateReviewDto) { return this.srv.create(dto); }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReviewDto) {
    return this.srv.updateReview(id, dto);
  }

  @Patch(':id/reply')
  reply(@Param('id', ParseIntPipe) id: number, @Body('ownerReply') ownerReply: string) {
    return this.srv.updateReview(id, { ownerReply });
  }

  @Get('teacher/:teacherId')
  findByTeacher(
    @Param('teacherId', ParseIntPipe) teacherId: number,
    @Query() q: QueryReviewDto
  ) {
    return this.srv.findByTeacher(teacherId, q);
  }
}

