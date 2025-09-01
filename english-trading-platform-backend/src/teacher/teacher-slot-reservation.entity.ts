// src/teacher/teacher-slot-reservation.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

@Entity('teacher_slot_reservations')
@Index(['enrollmentId', 'teacherId', 'day', 'start', 'end'], { unique: true }) // idempotent
export class TeacherSlotReservation {
  @PrimaryGeneratedColumn() id: number;

  @Column() enrollmentId: number;
  @Column() teacherId: number;

  @Column({ length: 8 }) day: string;     // mon|tue|wed|thu|fri|sat|sun
  @Column({ length: 5 }) start: string;   // 'HH:MM'
  @Column({ length: 5, name: 'end' }) end: string; // cột DB là `end`

  @CreateDateColumn() createdAt: Date;
}
