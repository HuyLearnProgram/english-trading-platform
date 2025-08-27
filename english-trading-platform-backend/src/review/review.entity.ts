// src/review/review.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Teacher } from '../teacher/teacher.entity';

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  rating: number;

  @Column('text')
  reviewText: string;

  @Column({ nullable: true })
  courseName?: string;

  @Column({ nullable: true })
  totalHours?: string;

  @Column({ nullable: true })
  ownerReply?: string;

  @ManyToOne(() => User, u => u.reviews, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Teacher, t => t.reviews, { onDelete: 'CASCADE' })
  teacher: Teacher;

  @CreateDateColumn()
  createdAt: Date;
}
