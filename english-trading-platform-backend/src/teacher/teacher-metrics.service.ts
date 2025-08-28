// src/teacher/teacher-metrics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from '../lesson/lesson.entity';
import { Enrollment } from '../enrollment/enrollment.entity';
import { RefundRequest } from '../refund/refund-request.entity';
import { Review } from '../review/review.entity';

const MINUTES_LATE_THRESHOLD = 5;

@Injectable()
export class TeacherMetricsService {
  constructor(
    @InjectRepository(Lesson) private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(Enrollment) private readonly enrollRepo: Repository<Enrollment>,
    @InjectRepository(RefundRequest) private readonly refundRepo: Repository<RefundRequest>,
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
  ) {}

  private now() { return new Date(); }

  async getMetrics(teacherId: number) {
    const now = this.now();
    const from90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const from180 = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

    // ===== A) Hoạt động 90 ngày =====
    const { completedCnt } = await this.lessonRepo.createQueryBuilder('l')
      .select('COUNT(*)', 'completedCnt')
      .where('l.teacherId = :id', { id: teacherId })
      .andWhere('l.status = :st', { st: 'completed' })
      .andWhere('l.startAt >= :from', { from: from90 })
      .getRawOne<{ completedCnt: string }>();
    const completed_lessons_90d = Number(completedCnt || 0);

    const { uniqStudents } = await this.lessonRepo.createQueryBuilder('l')
      .select('COUNT(DISTINCT l.studentId)', 'uniqStudents')
      .where('l.teacherId = :id', { id: teacherId })
      .andWhere('l.status = :st', { st: 'completed' })
      .andWhere('l.startAt >= :from', { from: from90 })
      .getRawOne<{ uniqStudents: string }>();
    const unique_students_90d = Number(uniqStudents || 0);

    const repeats = await this.lessonRepo.createQueryBuilder('l')
      .select('l.studentId', 'studentId')
      .addSelect('COUNT(*)', 'cnt')
      .where('l.teacherId = :id', { id: teacherId })
      .andWhere('l.status = :st', { st: 'completed' })
      .andWhere('l.startAt >= :from', { from: from90 })
      .groupBy('l.studentId')
      .having('COUNT(*) >= 2')
      .getRawMany<{ studentId: number; cnt: string }>();
    const repeat_student_rate =
      unique_students_90d > 0 ? repeats.length / unique_students_90d : null;

    // ===== B) Độ tin cậy 90 ngày =====
    const { scheduledTotal } = await this.lessonRepo.createQueryBuilder('l')
      .select('COUNT(*)', 'scheduledTotal')
      .where('l.teacherId = :id', { id: teacherId })
      .andWhere('l.startAt >= :from', { from: from90 })
      .andWhere('l.status IN (:...sts)', { sts: ['scheduled','completed','cancelled'] })
      .getRawOne<{ scheduledTotal: string }>();

    const { teacherCancelled } = await this.lessonRepo.createQueryBuilder('l')
      .select('COUNT(*)', 'teacherCancelled')
      .where('l.teacherId = :id', { id: teacherId })
      .andWhere('l.startAt >= :from', { from: from90 })
      .andWhere('l.status = :st', { st: 'cancelled' })
      .andWhere('l.cancelledBy = :by', { by: 'teacher' })
      .getRawOne<{ teacherCancelled: string }>();

    const cancel_rate_teacher =
      Number(scheduledTotal || 0) > 0 ? Number(teacherCancelled || 0) / Number(scheduledTotal) : null;

    const { completedForOnTime } = await this.lessonRepo.createQueryBuilder('l')
      .select('COUNT(*)', 'completedForOnTime')
      .where('l.teacherId = :id', { id: teacherId })
      .andWhere('l.status = :st', { st: 'completed' })
      .andWhere('l.startAt >= :from', { from: from90 })
      .getRawOne<{ completedForOnTime: string }>();

    // === MySQL-only: đúng giờ nếu teacherJoinedAt <= startAt + 5 phút
    const { onTime } = await this.lessonRepo.createQueryBuilder('l')
      .select('COUNT(*)', 'onTime')
      .where('l.teacherId = :id', { id: teacherId })
      .andWhere('l.status = :st', { st: 'completed' })
      .andWhere('l.startAt >= :from', { from: from90 })
      .andWhere('l.teacherJoinedAt IS NOT NULL')
      // TIMESTAMPDIFF(MINUTE, startAt, joinedAt) <= 5
      .andWhere(`TIMESTAMPDIFF(MINUTE, l.startAt, l.teacherJoinedAt) <= ${MINUTES_LATE_THRESHOLD}`)
      .getRawOne<{ onTime: string }>();

    const on_time_rate =
      Number(completedForOnTime || 0) > 0 ? Number(onTime || 0) / Number(completedForOnTime) : null;

    // ===== D) Kết quả/Quan hệ dài hạn =====
    const baseEnrollQ = this.enrollRepo.createQueryBuilder('e')
      .where('e.teacherId = :id', { id: teacherId })
      .andWhere('e.status = :st', { st: 'paid' })
      .andWhere('e.createdAt >= :from', { from: from180 });

    const { totalStuPaid } = await baseEnrollQ.clone()
      .select('COUNT(DISTINCT e.studentId)', 'totalStuPaid')
      .getRawOne<{ totalStuPaid: string }>();

    const renewed = await baseEnrollQ.clone()
      .select('e.studentId', 'studentId')
      .addSelect('COUNT(*)', 'cnt')
      .groupBy('e.studentId')
      .having('COUNT(*) >= 2')
      .getRawMany<{ studentId: number; cnt: string }>();

    const renewal_rate =
      Number(totalStuPaid || 0) > 0 ? renewed.length / Number(totalStuPaid) : null;

    const eligibleQ = this.refundRepo.createQueryBuilder('r')
      .where('r.teacherId = :id', { id: teacherId })
      .andWhere('r.createdAt >= :from', { from: from180 })
      .andWhere('r.eligible = true');

    const { eligTotal } = await eligibleQ.clone()
      .select('COUNT(*)', 'eligTotal')
      .getRawOne<{ eligTotal: string }>();

    const { eligApproved } = await eligibleQ.clone()
      .andWhere('r.status = :s', { s: 'approved' })
      .select('COUNT(*)', 'eligApproved')
      .getRawOne<{ eligApproved: string }>();

    const refund_rate_eligible =
      Number(eligTotal || 0) > 0 ? Number(eligApproved || 0) / Number(eligTotal) : null;

    // ===== E) Nhận xét mới nhất =====
    const reviews = await this.reviewRepo.find({
      where: { teacher: { id: teacherId } } as any,
      order: { createdAt: 'DESC' },
      take: 3,
      relations: ['user'],
    });

    return {
      teacherId,
      windows: { activityDays: 90, outcomeDays: 180 },
      activity: {
        completed_lessons_90d,
        unique_students_90d,
        repeat_student_rate,
      },
      reliability: {
        cancel_rate_teacher,
        on_time_rate,
      },
      outcomes: {
        renewal_rate,
        refund_rate_eligible,
      },
      recentReviews: reviews.map(r => ({
        id: (r as any).id,
        rating: (r as any).rating,
        content: (r as any).content,
        studentName: (r as any).user?.fullName,
        createdAt: (r as any).createdAt,
      })),
      computedAt: now,
    };
  }
}
