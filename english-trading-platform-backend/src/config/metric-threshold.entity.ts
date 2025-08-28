// src/config/metric-threshold.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, Index } from 'typeorm';

export type MetricDirection = 'up' | 'down' | 'window';

@Entity('metric_thresholds')
export class MetricThreshold {
  @PrimaryGeneratedColumn()
  id: number;

  // ví dụ: 'ontime_up', 'cancel_down', 'activityDays'
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  key: string;

  // 'up' | 'down' | 'window'
  @Column({ type: 'enum', enum: ['up', 'down', 'window'] })
  direction: MetricDirection;

  // với direction = 'up' | 'down'
  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  good: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  warn: number | null;

  // với direction = 'window'
  @Column({ type: 'int', nullable: true })
  windowDays: number | null;

  @Column({ type: 'int', nullable: true })
  updated_by: number | null;

  @UpdateDateColumn()
  updated_at: Date;
}
