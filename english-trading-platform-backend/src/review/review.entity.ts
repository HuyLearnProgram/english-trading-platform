// src/reviews/review.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Teacher } from '../teacher/teacher.entity';

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('int')
  rating: number; // 1..5

  @Column('text')
  reviewText: string;

  @ManyToOne(() => User, user => user.reviews, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Teacher, teacher => teacher.reviews, { onDelete: 'CASCADE' })
  teacher: Teacher;

  @CreateDateColumn()
  createdAt: Date;
}
