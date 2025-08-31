import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Review } from '../review/review.entity';

export type UserRole = 'admin' | 'teacher' | 'student';
export type AccountStatus = 'visible' | 'hidden';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true }) email: string;
  @Column() password: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  phone?: string;

  // NEW: ẩn/hiện tài khoản
  @Column({ type: 'enum', enum: ['visible', 'hidden'], default: 'visible' })
  status: AccountStatus;

  // Giữ cho tương thích ngược (có thể null dần):
  @Column({ type: 'enum', enum: ['admin', 'teacher', 'student'], default: 'student' })
  role: UserRole;

  @OneToMany(() => Review, review => review.user)
  reviews: Review[];
}
