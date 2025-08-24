// src/teacher/teacher.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Review } from '../review/review.entity';
import { LessonPackage } from '../lesson-package/lesson-package.entity';
import { Blog } from 'src/blog/blog.entity';

@Entity()
export class Teacher {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  headline: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  specialties: string; // CSV: “Giao tiếp, IELTS”

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hourlyRate: number;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewsCount: number;

  // ====== thêm các trường để lọc theo FE ======
  @Column({ nullable: true })
  gender: string;  // vd: “Male”, “Female” hoặc CSV “Male,Female”

  @Column({ nullable: true })
  level: string;   // vd: “Beginner,Intermediate” (CSV)

  @Column({ nullable: true })
  certs: string;   // vd: “IELTS,TOEFL” (CSV)
  // ============================================

  @Column('json', { nullable: true })
  weeklyAvailability: any;


  @OneToMany(() => Review, review => review.teacher)
  reviews: Review[];

  @OneToMany(() => LessonPackage, p => p.teacher, { cascade: true })
  lessonPackages: LessonPackage[];

  @OneToMany(() => Blog, (b) => b.author)
  blogs: Blog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
