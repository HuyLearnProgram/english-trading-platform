// src/review/review.service.ts
import { Injectable, NotFoundException,  ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Review } from './review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { User } from '../users/user.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    const user = await this.userRepository.findOneBy({ id: createReviewDto.userId });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const review = new Review();
    review.rating = createReviewDto.rating;
    review.reviewText = createReviewDto.reviewText;
    review.user = user;

    return this.reviewRepository.save(review);
  }

  async updateReview(id: number, updateReviewDto: UpdateReviewDto): Promise<Review> {
    const review = await this.reviewRepository.findOneBy({ id });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (updateReviewDto.rating !== undefined) {
      review.rating = updateReviewDto.rating;
    }
    if (updateReviewDto.reviewText !== undefined) {
      review.reviewText = updateReviewDto.reviewText;
    }
    return this.reviewRepository.save(review);
  }

  async findByOwner(ownerId: number): Promise<Review[]> {

    const reviews = await this.reviewRepository.find({
      where: { },
      relations: ['user', 'service'],
    });

    console.log('Reviews:', reviews); 
    return reviews;
  }
  async findByService(serviceId: number): Promise<Review[]> {

  
    const reviews = await this.reviewRepository.find({
      where: { },
      relations: ['user', 'service'],
    });
  
    return reviews;
  }
  
}
