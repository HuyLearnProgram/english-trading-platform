import {
  Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn,
  OneToMany, CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { User } from 'src/users/user.entity';
import { Enrollment } from 'src/enrollment/enrollment.entity';
import { CalendarEntry } from 'src/common/types/student';

@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  /** Liên kết 1-1 với bảng users (đang dùng userId làm “khóa tự nhiên” để khớp với Enrollment.studentId) */
  @Column({ nullable: true })
  userId?: number;

  @OneToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  // --- thông tin hồ sơ ---
  @Column({ nullable: true }) fullName?: string;
  @Column({ type: 'date', nullable: true }) dob?: string;          // YYYY-MM-DD
  @Column({ nullable: true }) gender?: string;                     // 'Male' | 'Female' | ...
  @Column({ nullable: true }) country?: string;
  /** Múi giờ học của HS (rất quan trọng để render calendar và đồng bộ Google Calendar) */
  @Column({ nullable: true }) timezone?: string;  // ví dụ: 'Asia/Ho_Chi_Minh'

  // thông tin phụ huynh (nếu là học sinh nhỏ tuổi)
  @Column({ nullable: true }) parentName?: string;
  @Column({ nullable: true }) parentPhone?: string;
  @Column({ nullable: true }) parentEmail?: string;

  // mục tiêu/level
  @Column({ nullable: true }) level?: string;                      // Beginner/Intermediate/Advanced
  @Column({ type: 'text', nullable: true }) goals?: string;

  // lịch học & ưu tiên lịch
  @Column({ type: 'json', nullable: true }) weeklyAvailability?: any; // cùng format với teacher
  @Column({ type: 'json', nullable: true }) preferredSlots?: string[]; // ['mon 10:00-11:00', ...]

  /** Lịch học đã phát sinh theo từng đơn */
  @Column({ type: 'json', nullable: true })
  calendar?: { entries: CalendarEntry[] };
  
  @OneToMany(() => Enrollment, e => e.student)
  enrollments: Enrollment[];

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
