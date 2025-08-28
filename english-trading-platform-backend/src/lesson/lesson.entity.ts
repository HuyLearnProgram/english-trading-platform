import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Teacher } from '../teacher/teacher.entity';

export type LessonStatus = 'scheduled' | 'completed' | 'cancelled';
export type CancelledBy = 'teacher' | 'student' | 'system';

@Entity('lessons')
@Index('idx_lessons_teacher_time', ['teacherId', 'startAt'])
export class Lesson {
  @PrimaryGeneratedColumn() id: number;

  @Column() @Index() teacherId: number;
  @Column() @Index() studentId: number;

  @ManyToOne(() => Teacher, t => t.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher;

  @Column({ type: 'datetime' }) startAt: Date;
  @Column({ type: 'datetime', nullable: true }) teacherJoinedAt?: Date;

  @Column({ type: 'varchar' }) status: LessonStatus;            // scheduled|completed|cancelled
  @Column({ type: 'varchar', nullable: true }) cancelledBy?: CancelledBy;

  @CreateDateColumn() createdAt: Date;
}
