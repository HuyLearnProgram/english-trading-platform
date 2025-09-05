// src/google/google-account.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('google_accounts')
@Unique(['userId'])
export class GoogleAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column() userId: number;
  @Column({ nullable: true }) googleId?: string;
  @Column({ nullable: true }) email?: string;

  // Chỉ cần refresh_token là đủ; access_token sẽ lấy lại bằng refresh
  @Column({ type: 'text' }) refreshToken: string;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
