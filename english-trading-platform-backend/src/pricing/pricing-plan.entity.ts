// src/pricing/pricing-plan.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('pricing_plans')
export class PricingPlan {
  @PrimaryGeneratedColumn() id: number;

  @Index({ unique: true })
  @Column({ type: 'int' })
  hours: number;                    // 30, 36, 60, 72, 108, 120, 144, 180

  @Column({ type: 'float', default: 0 })
  discountPct: number;              // 0..1  (vd 0.12 = 12%)

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
