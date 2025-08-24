import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Teacher } from '../teacher/teacher.entity';

@Entity()
export class LessonPackage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string; // ví dụ: "Gói 5 buổi 1-1"

  @Column({ type: 'text'})
  description: string;

  @Column('int')
  lessonsCount: number; // số buổi trong gói

  @Column('int')
  durationPerLesson: number; // phút / buổi (vd 60)

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @Column()
  isActive: boolean;

  // Gói có thể gắn theo giáo viên cụ thể (linh hoạt giá theo teacher)
  @ManyToOne(() => Teacher, teacher => teacher.lessonPackages, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'teacherId' })
  teacher: Teacher | null;

}
