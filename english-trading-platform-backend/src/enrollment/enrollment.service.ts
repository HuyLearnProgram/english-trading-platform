// src/enrollment/enrollment.service.ts
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Enrollment } from './enrollment.entity';
import { CreateEnrollmentDto, UpdateEnrollmentDto, QueryEnrollmentsDto } from './dto';
import { Teacher } from 'src/teacher/teacher.entity';
import { PricingService } from 'src/pricing/pricing.service';
import { TeachersService } from 'src/teacher/teacher.service';
import { Student } from 'src/student/student.entity';
import { User } from 'src/users/user.entity';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment) private readonly repo: Repository<Enrollment>,
    @InjectRepository(Teacher) private readonly teacherRepo: Repository<Teacher>,
    @InjectRepository(Student) private readonly studentRepo: Repository<Student>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly pricing: PricingService,
    private readonly teachersService: TeachersService, 
  ) {}

  private round2(n: number) { return Math.round((n + Number.EPSILON) * 100) / 100; }

  private async computeSnapshot(teacherId: number, planHours: number) {
    const teacher = await this.teacherRepo.findOne({ where: { id: teacherId } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    const plans = await this.pricing.getActivePlans();
    const plan = plans.find(p => p.hours === planHours && p.isActive);
    if (!plan) throw new BadRequestException('Plan not found');

    const lessonLen  = teacher.lessonLengthMinutes;
    const hourlyRate = Number(teacher.hourlyRate || 0);

    const lessons  = Math.ceil((planHours * 60) / lessonLen);
    const unit0    = this.round2(hourlyRate * (lessonLen / 60));
    const gross    = this.round2(lessons * unit0);
    const discount = this.round2(gross * (plan.discountPct ?? 0));
    const total    = this.round2(gross - discount);

    return {
      lessonLen,
      hourlyRate,
      discountPct: plan.discountPct ?? 0,
      lessons,
      unit0,
      gross,
      discount,
      total,
    };
  }

  private async ensureStudentIdForUser(userId: number): Promise<number> {
    if (!userId) throw new BadRequestException('Missing userId');

    let st = await this.studentRepo.findOne({ where: { userId } });
    if (st) return st.id;

    const u = await this.userRepo.findOne({ where: { id: userId } });
    // tạo hồ sơ Student tối thiểu
    st = this.studentRepo.create({
      userId,
      fullName: (u as any)?.fullName || u?.email || undefined,
    });
    st = await this.studentRepo.save(st);
    return st.id;
  }

  /** Admin/manual create (hoặc dùng khi chưa tích hợp payment).
   *  Tạo enrollment + snapshot theo planHours. Status có thể truyền vào, default 'pending'.
   */
  async create(dto: CreateEnrollmentDto) {
    const studentId = await this.ensureStudentIdForUser(dto.studentId);

    const {
      lessonLen, hourlyRate, discountPct, lessons, unit0, gross, discount, total,
    } = await this.computeSnapshot(dto.teacherId, dto.planHours);

    const entity = this.repo.create({
      teacherId: dto.teacherId,
      studentId, // nếu có JWT thì nên lấy từ req.user ở controller
      status: dto.status ?? 'pending',

      planHours: dto.planHours,
      lessons,
      lessonLengthMinutesSnapshot: lessonLen,
      hourlyRateSnapshot: hourlyRate,
      discountPctApplied: discountPct,
      unitPriceBeforeDiscount: unit0,
      gross, discount, total, currency: 'VND',

      lessonsPerWeek: Math.max(1, Math.min(5, dto.lessonsPerWeek ?? 1)),
      preferredSlots: Array.isArray(dto.preferredSlots) ? dto.preferredSlots : undefined,
    });

    return this.repo.save(entity);
  }

  /** Purchase cho học sinh (snapshot + status pending). studentId lấy từ context nếu có. */
  async purchase(dto: CreateEnrollmentDto, studentIdFromCtx: number) {
    const userId = studentIdFromCtx ?? dto.studentId; // userId từ JWT hoặc payload
    const studentId = await this.ensureStudentIdForUser(userId);
    const {
      lessonLen, hourlyRate, discountPct, lessons, unit0, gross, discount, total,
    } = await this.computeSnapshot(dto.teacherId, dto.planHours);

    const en = this.repo.create({
      teacherId: dto.teacherId,
      studentId,  // tốt nhất lấy từ auth context
      status: 'pending',

      planHours: dto.planHours,
      lessons,
      lessonLengthMinutesSnapshot: lessonLen,
      hourlyRateSnapshot: hourlyRate,
      discountPctApplied: discountPct,
      unitPriceBeforeDiscount: unit0,
      gross, discount, total, currency: 'VND',

      lessonsPerWeek: Math.max(1, Math.min(5, dto.lessonsPerWeek ?? 1)),
      preferredSlots: Array.isArray(dto.preferredSlots) ? dto.preferredSlots : undefined,
    });

    return this.repo.save(en);
  }

  async update(id: number, dto: UpdateEnrollmentDto) {
    const cur = await this.repo.findOne({ where: { id } });
    if (!cur) throw new NotFoundException('Enrollment not found');

    // KHÔNG cập nhật snapshot giá sau khi tạo
    if (dto.teacherId != null) cur.teacherId = dto.teacherId;
    if (dto.studentId != null) cur.studentId = dto.studentId;
    if (dto.status != null) cur.status = dto.status as any;

    if (dto.lessonsPerWeek != null) {
      cur.lessonsPerWeek = Math.max(1, Math.min(5, dto.lessonsPerWeek));
    }
    if (Array.isArray(dto.preferredSlots)) {
      cur.preferredSlots = dto.preferredSlots;
    }

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

  /** Confirm (thanh toán thành công) + giữ chỗ các slot */
  async confirmAndReserve(enrollmentId: number, overrideSlots?: string[]) {
    const en = await this.repo.findOne({ where: { id: enrollmentId } });
    if (!en) throw new NotFoundException('Enrollment not found');

    if (en.status !== 'pending') {
      throw new BadRequestException(`Enrollment đã ở trạng thái ${en.status}.`);
    }

    const keys = (overrideSlots?.length ? overrideSlots : en.preferredSlots) ?? [];
    if (!keys.length) {
      throw new BadRequestException('Chưa có danh sách slot để giữ chỗ.');
    }

    try {
      await this.teachersService.tryReserveSlots(en.teacherId, keys, en.id);
    } catch (e) {
      // ConflictException từ tryReserveSlots -> báo ra ngoài
      if (e instanceof ConflictException) throw e;
      throw e;
    }

    // giữ chỗ xong mới cập nhật trạng thái đơn
    en.status = 'paid';
    return this.repo.save(en);
  }

  /** Hủy/cancel đơn -> nhả chỗ nếu đã giữ (idempotent) */
  async cancelAndRelease(enrollmentId: number) {
    const en = await this.repo.findOne({ where: { id: enrollmentId } });
    if (!en) throw new NotFoundException('Enrollment not found');

    // Tùy rule: chỉ release nếu đơn đang 'paid' (đã giữ chỗ)
    if (en.status === 'paid' && en.preferredSlots?.length) {
      await this.teachersService.releaseSlots(en.teacherId, en.preferredSlots, en.id);
    }
    en.status = 'cancelled';
    return this.repo.save(en);
  }

  /** Refund -> nhả chỗ (tương tự cancel) */
  async refundAndRelease(enrollmentId: number) {
    const en = await this.repo.findOne({ where: { id: enrollmentId } });
    if (!en) throw new NotFoundException('Enrollment not found');

    if (en.status === 'paid' && en.preferredSlots?.length) {
      await this.teachersService.releaseSlots(en.teacherId, en.preferredSlots, en.id);
    }
    en.status = 'refunded';
    return this.repo.save(en);
  }
}
