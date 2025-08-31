import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export type NotificationType = 'refund' | 'system';

@Entity('notifications')
@Index('idx_n_user_read', ['userId', 'read'])
export class Notification {
  @PrimaryGeneratedColumn() id: number;

  @Column() @Index()
  userId: number;              // recipient (studentId == userId)

  @Column({ length: 160 })
  title: string;

  @Column({ type: 'text', nullable: true })
  body?: string | null;

  @Column({ type: 'varchar', length: 32, default: 'system' })
  type: NotificationType;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
