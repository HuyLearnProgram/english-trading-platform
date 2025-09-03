// src/enrollment/enrollment.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Teacher } from '../teacher/teacher.entity';
import { PaymentMethod } from 'src/common/types/payment';

export type OrderStatus = 'paid' | 'refunded' | 'cancelled' | 'pending';

@Entity('enrollments')
@Index('idx_enroll_teacher_time', ['teacherId', 'createdAt'])
export class Enrollment {
  @PrimaryGeneratedColumn() id: number;

  @Column() @Index() teacherId: number;
  @Column() @Index() studentId: number;

  @ManyToOne(() => Teacher, t => t.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  // Trạng thái đơn
  @Column({ type: 'varchar' }) status: OrderStatus;


  // === thông tin thanh toán ===
  @Column({ type: 'varchar', default: 'unknown' })
  paymentMethod: PaymentMethod;             // ví dụ: 'vnpay', 'stripe', 'cod' …

  @Column({ type: 'varchar', nullable: true })
  paymentRef?: string;                      // mã giao dịch từ cổng (VD: vnp_TransactionNo)

  @Column({ type: 'json', nullable: true })
  paymentMeta?: Record<string, any>;        // bankCode, cardType, payDate, v.v…

  // ---- Thông tin gói & snapshot giá tại thời điểm mua ----
  @Column({ type: 'int' })    planHours: number;                 // gói đã chọn (30/36/60/...)
  @Column({ type: 'int' })    lessons: number;                   // số buổi suy ra từ planHours
  @Column({ type: 'int' })    lessonLengthMinutesSnapshot: number;
  @Column({ type: 'decimal', precision: 12, scale: 2 }) hourlyRateSnapshot: number;     // đơn giá/giờ GV tại thời điểm mua
  @Column({ type: 'float' })  discountPctApplied: number;        // 0..1
  @Column({ type: 'decimal', precision: 12, scale: 2 }) unitPriceBeforeDiscount; // = hourlyRateSnapshot*(lessonLength/60)
  @Column({ type: 'decimal', precision: 12, scale: 2 }) gross;
  @Column({ type: 'decimal', precision: 12, scale: 2 }) discount;
  @Column({ type: 'decimal', precision: 12, scale: 2 }) total;
  @Column({ type: 'varchar', default: 'VND' }) currency: string;

  // ---- Tuỳ chọn lịch do HS chọn lúc order (không bắt buộc) ----
  @Column({ type: 'int', default: 1 }) lessonsPerWeek: number;
  @Column({ type: 'json', nullable: true }) preferredSlots?: string[]; // ['mon 09:00-09:45', ...]

  @CreateDateColumn() createdAt: Date;
}
