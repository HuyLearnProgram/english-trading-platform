import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('teacher_slots')
@Index(['teacherId', 'day', 'start', 'end'], { unique: true })
export class TeacherSlot {
  @PrimaryGeneratedColumn() id: number;

  @Column() teacherId: number;

  /** mon|tue|wed|thu|fri|sat|sun */
  @Column({ length: 8 }) day: string;

  /** 'HH:MM' */
  @Column({ length: 5 }) start: string;

  /** 'HH:MM' */
  @Column({ length: 5 }) end: string;

  /** bật/tắt theo weeklyAvailability */
  @Column({ default: true }) isActive: boolean;

  /** sức chứa 1 slot (mặc định 1) */
  @Column({ type: 'int', default: 1 }) capacity: number;

  /** số chỗ đã giữ */
  @Column({ type: 'int', default: 0 }) reservedCount: number;

  @CreateDateColumn() createdAt: Date;

  @UpdateDateColumn() updatedAt: Date;
}
