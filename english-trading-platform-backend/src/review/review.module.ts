// src/review/review.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { User } from '../users/user.entity';
import { ReviewService } from './review.service';
import { ReviewController } from './review.controller';
import { Teacher } from 'src/teacher/teacher.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Review, User, Teacher])], 
  providers: [ReviewService],
  controllers: [ReviewController],
})
export class ReviewModule {}
