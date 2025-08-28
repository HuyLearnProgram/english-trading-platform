// src/lesson/lesson.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Lesson } from './lesson.entity';
import { CreateLessonDto, UpdateLessonDto, QueryLessonsDto } from './dto';

@Injectable()
export class LessonsService {
  constructor(@InjectRepository(Lesson) private readonly repo: Repository<Lesson>) {}

  async create(dto: CreateLessonDto) {
    const entity = this.repo.create({
      teacherId: dto.teacherId,
      studentId: dto.studentId,
      startAt: new Date(dto.startAt),
      teacherJoinedAt: dto.teacherJoinedAt ? new Date(dto.teacherJoinedAt) : null,
      status: dto.status,
      cancelledBy: dto.cancelledBy ?? null,
    });
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateLessonDto) {
    const cur = await this.repo.findOne({ where: { id } });
    if (!cur) throw new NotFoundException('Lesson not found');

    if (dto.teacherId != null) cur.teacherId = dto.teacherId;
    if (dto.studentId != null) cur.studentId = dto.studentId;
    if (dto.startAt != null) cur.startAt = new Date(dto.startAt);
    if (dto.teacherJoinedAt !== undefined) {
      cur.teacherJoinedAt = dto.teacherJoinedAt ? new Date(dto.teacherJoinedAt) : null;
    }
    if (dto.status != null) cur.status = dto.status as any;
    if (dto.cancelledBy !== undefined) cur.cancelledBy = dto.cancelledBy as any;

    return this.repo.save(cur);
  }

  async delete(id: number) {
    const cur = await this.repo.findOne({ where: { id } });
    if (!cur) throw new NotFoundException('Lesson not found');
    await this.repo.remove(cur);
    return { deleted: true };
  }

  async findOne(id: number) {
    const cur = await this.repo.findOne({ where: { id } });
    if (!cur) throw new NotFoundException('Lesson not found');
    return cur;
  }

  async findAll(q: QueryLessonsDto) {
    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(100, Math.max(1, q.limit ?? 20));

    const where: any = {};
    if (q.teacherId != null) where.teacherId = q.teacherId;
    if (q.studentId != null) where.studentId = q.studentId;
    if (q.status) where.status = q.status;

    if (q.from || q.to) {
      const from = q.from ? new Date(q.from) : new Date('1970-01-01');
      const to = q.to ? new Date(q.to) : new Date('2999-12-31');
      where.startAt = Between(from, to);
    }

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { startAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
