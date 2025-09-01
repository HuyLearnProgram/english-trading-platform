// src/teacher/teacher.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Review } from '../review/review.entity';
import { Blog } from 'src/blog/blog.entity';
import { Lesson } from '../lesson/lesson.entity';
import { Enrollment } from '../enrollment/enrollment.entity';
import { RefundRequest } from '../refund/refund-request.entity';
import { User } from 'src/users/user.entity';

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

  /** Độ dài 1 lesson (phút). 45 | 60 | 90 (mặc định 45) */
  @Column({ type: 'int', default: 45 })
  lessonLengthMinutes: number;
  
  @Column('json', { nullable: true })
  weeklyAvailability: any;

  // map sang user
  @Column({ nullable: true })
  userId?: number;

  @OneToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: User;


  @OneToMany(() => Review, review => review.teacher) reviews: Review[];
  @OneToMany(() => Blog, (b) => b.author) blogs: Blog[];
  @OneToMany(() => Lesson, l => l.teacher) lessons: Lesson[];
  @OneToMany(() => Enrollment, e => e.teacher) enrollments: Enrollment[];
  @OneToMany(() => RefundRequest, r => r.teacher) refunds: RefundRequest[];

  @Column('json', { nullable: true })
  certificates?: Array<{ name: string; fileUrl?: string; verified?: boolean }>;

  @Column('json', { nullable: true })
  education?: Array<{ title: string; org: string; start?: string; end?: string; verified?: boolean }>;

  @Column('json', { nullable: true })
  experiences?: Array<{ title: string; company: string; start?: string; end?: string; desc?: string }>;

  @Column({ nullable: true }) demoVideoUrl?: string;          // video giới thiệu
  @Column({ nullable: true }) sampleClassVideoUrl?: string;   // “Xem lớp học mẫu”
  @Column({ nullable: true }) audioUrl?: string;              // file audio

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
