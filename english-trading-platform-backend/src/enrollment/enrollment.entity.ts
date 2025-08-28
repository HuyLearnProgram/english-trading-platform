import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Teacher } from '../teacher/teacher.entity';

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

  @Column({ type: 'varchar' }) status: OrderStatus;  // chỉ tính renewal trên 'paid'
  @Column({ type: 'int', default: 0 }) hoursPurchased: number;

  @CreateDateColumn() createdAt: Date;
}
