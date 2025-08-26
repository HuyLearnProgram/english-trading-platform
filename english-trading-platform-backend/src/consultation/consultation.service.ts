// src/consultation/consultation.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { Consultation } from './consultation.entity';
import { CreateConsultationDto, UpdateConsultationDto, QueryConsultationDto } from './dto';
import { Teacher } from '../teacher/teacher.entity';

@Injectable()
export class ConsultationService {
  constructor(
    @InjectRepository(Consultation) private readonly repo: Repository<Consultation>,
    @InjectRepository(Teacher) private readonly teacherRepo: Repository<Teacher>,
  ) {}

  async create(dto: CreateConsultationDto) {
    // nếu có teacherId mà chưa có teacherName => tự fill
    let teacherName = dto.teacherName;
    let teacherId = dto.teacherId;

    if (teacherId) {
      const t = await this.teacherRepo.findOne({ where: { id: teacherId } });
      if (t && !teacherName) teacherName = t.fullName;
      if (!t) teacherId = undefined; // tránh gãy
    }

    const item = this.repo.create({
      fullName: dto.fullName.trim(),
      phone: dto.phone.trim(),
      email: dto.email?.trim(),
      message: dto.message,
      teacherName,
      teacherId,
      source: dto.source ?? 'blog',
      blogSlug: dto.blogSlug,
      status: 'new',
    });
    return this.repo.save(item);
  }

  async findAll(q: QueryConsultationDto) {
    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(100, Math.max(1, q.limit ?? 20));

    const qb = this.repo.createQueryBuilder('c')
      .leftJoinAndSelect('c.teacher', 't');

    if (q.status) qb.andWhere('c.status = :status', { status: q.status });
    if (q.teacherId) qb.andWhere('c.teacherId = :tid', { tid: q.teacherId });

    if (q.search) {
      const s = `%${q.search.toLowerCase()}%`;
      qb.andWhere(new Brackets(w => {
        w.where('LOWER(c.fullName) LIKE :s', { s })
         .orWhere('LOWER(c.phone) LIKE :s', { s })
         .orWhere('LOWER(c.email) LIKE :s', { s })
         .orWhere('LOWER(c.teacherName) LIKE :s', { s });
      }));
    }

    qb.orderBy('c.createdAt', 'DESC');

    const [items, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Consultation not found');
    return c;
  }

  async update(id: number, dto: UpdateConsultationDto) {
    // hỗ trợ cập nhật teacherId/teacherName
    let teacherName = dto.teacherName;
    let teacherId = dto.teacherId;

    if (teacherId !== undefined) {
      const t = teacherId ? await this.teacherRepo.findOne({ where: { id: teacherId } }) : null;
      teacherName = teacherName ?? t?.fullName;
      if (!t) teacherId = undefined;
    }

    const cur = await this.repo.preload({
      id,
      ...dto,
      teacherId,
      teacherName,
    });
    if (!cur) throw new NotFoundException('Consultation not found');
    return this.repo.save(cur);
  }

  async remove(id: number) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Consultation not found');
    await this.repo.remove(c);
    return { deleted: true };
  }
}
