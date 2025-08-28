// src/review/review.service.ts
import { Injectable, NotFoundException,  ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Review } from './review.entity';
import { CreateReviewDto, QueryReviewDto, UpdateReviewDto } from './dto';
import { User } from '../users/user.entity';
import { Teacher } from 'src/teacher/teacher.entity';

// src/review/review.service.ts  (chỉnh toàn bộ theo Teacher)
@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
    @InjectRepository(User)   private userRepo: Repository<User>,
    @InjectRepository(Teacher) private teacherRepo: Repository<Teacher>,
  ) {}

  async create(dto: CreateReviewDto) {
    const user = await this.userRepo.findOneBy({ id: dto.userId });
    if (!user) throw new NotFoundException('User not found');

    const teacher = await this.teacherRepo.findOneBy({ id: dto.teacherId });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const r = this.reviewRepo.create({
      rating: dto.rating,
      reviewText: dto.reviewText,
      courseName: dto.courseName,
      totalHours: dto.totalHours,
      user,
      teacher,
    });
    return this.reviewRepo.save(r);
  }

  async updateReview(id: number, dto: UpdateReviewDto) {
    const r = await this.reviewRepo.findOne({ where: { id }, relations: ['user','teacher'] });
    if (!r) throw new NotFoundException('Review not found');
    if (dto.rating != null) r.rating = dto.rating;
    if (dto.reviewText != null) r.reviewText = dto.reviewText;
    if (dto.ownerReply != null) r.ownerReply = dto.ownerReply;
    return this.reviewRepo.save(r);
  }

  async findByTeacher(teacherId: number, q: QueryReviewDto) {
    const page  = Math.max(1, q.page ?? 1);
    const limit = Math.min(50, Math.max(1, q.limit ?? 10));
    const [items, total] = await this.reviewRepo.findAndCount({
      where: { teacher: { id: teacherId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }
}
