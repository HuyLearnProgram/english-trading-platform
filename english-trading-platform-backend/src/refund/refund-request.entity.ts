import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Teacher } from '../teacher/teacher.entity';

export type RefundStatus = 'approved' | 'rejected' | 'pending';

@Entity('refund_requests')
@Index('idx_refund_teacher_time', ['teacherId', 'createdAt'])
export class RefundRequest {
  @PrimaryGeneratedColumn() id: number;

  @Column() @Index() teacherId: number;
  @Column() @Index() studentId: number;

  @ManyToOne(() => Teacher, t => t.refunds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  // Đã được Ops gắn cờ "đủ điều kiện" theo chính sách (≥60h, còn hiệu lực…)
  @Column({ type: 'boolean', default: false }) eligible: boolean;

  @Column({ type: 'varchar' }) status: RefundStatus; // tính rate trên eligible=true
  @CreateDateColumn() createdAt: Date;
}
