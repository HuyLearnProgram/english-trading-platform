// src/enrollment/enrollment.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Enrollment } from './enrollment.entity';
import { CreateEnrollmentDto, UpdateEnrollmentDto, QueryEnrollmentsDto } from './dto';
@Injectable()
export class EnrollmentsService {
  constructor(@InjectRepository(Enrollment) private readonly repo: Repository<Enrollment>) {}

  async create(dto: CreateEnrollmentDto) {
    const entity = this.repo.create({
      teacherId: dto.teacherId,
      studentId: dto.studentId,
      status: dto.status,
      hoursPurchased: dto.hoursPurchased ?? 0,
    });
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateEnrollmentDto) {
    const cur = await this.repo.findOne({ where: { id } });
    if (!cur) throw new NotFoundException('Enrollment not found');

    if (dto.teacherId != null) cur.teacherId = dto.teacherId;
    if (dto.studentId != null) cur.studentId = dto.studentId;
    if (dto.status != null) cur.status = dto.status as any;
    if (dto.hoursPurchased != null) cur.hoursPurchased = dto.hoursPurchased;

    return this.repo.save(cur);
  }

  async delete(id: number) {
    const cur = await this.repo.findOne({ where: { id } });
    if (!cur) throw new NotFoundException('Enrollment not found');
    await this.repo.remove(cur);
    return { deleted: true };
  }

  async findOne(id: number) {
    const cur = await this.repo.findOne({ where: { id } });
    if (!cur) throw new NotFoundException('Enrollment not found');
    return cur;
  }

  async findAll(q: QueryEnrollmentsDto) {
    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(100, Math.max(1, q.limit ?? 20));

    const where: FindOptionsWhere<Enrollment> = {};
    if (q.teacherId != null) where.teacherId = q.teacherId;
    if (q.studentId != null) where.studentId = q.studentId;
    if (q.status) where.status = q.status;

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
