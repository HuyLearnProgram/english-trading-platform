// src/refund/refund-request.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { RefundRequest } from './refund-request.entity';
import { CreateRefundDto, UpdateRefundDto, QueryRefundsDto } from './dto';

@Injectable()
export class RefundRequestsService {
  constructor(@InjectRepository(RefundRequest) private readonly repo: Repository<RefundRequest>) {}

  async create(dto: CreateRefundDto) {
    const entity = this.repo.create({
      teacherId: dto.teacherId,
      studentId: dto.studentId,
      eligible: dto.eligible,
      status: dto.status,
    });
    return this.repo.save(entity);
  }

  async update(id: number, dto: UpdateRefundDto) {
    const cur = await this.repo.findOne({ where: { id } });
    if (!cur) throw new NotFoundException('Refund request not found');

    if (dto.teacherId != null) cur.teacherId = dto.teacherId;
    if (dto.studentId != null) cur.studentId = dto.studentId;
    if (dto.eligible != null) cur.eligible = dto.eligible;
    if (dto.status != null) cur.status = dto.status as any;

    return this.repo.save(cur);
  }

  async delete(id: number) {
    const cur = await this.repo.findOne({ where: { id } });
    if (!cur) throw new NotFoundException('Refund request not found');
    await this.repo.remove(cur);
    return { deleted: true };
  }

  async findOne(id: number) {
    const cur = await this.repo.findOne({ where: { id } });
    if (!cur) throw new NotFoundException('Refund request not found');
    return cur;
  }

  async findAll(q: QueryRefundsDto) {
    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(100, Math.max(1, q.limit ?? 20));

    const where: FindOptionsWhere<RefundRequest> = {};
    if (q.teacherId != null) where.teacherId = q.teacherId;
    if (q.studentId != null) where.studentId = q.studentId;
    if (q.status) where.status = q.status;
    if (q.eligible != null) where.eligible = q.eligible === 'true';

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}
