// src/consultation/consultation.entity.ts
import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
    CreateDateColumn, UpdateDateColumn, Index
  } from 'typeorm';
  import { Teacher } from '../teacher/teacher.entity';
  
  export type ConsultationStatus = 'new' | 'contacted' | 'scheduled' | 'done' | 'canceled';
  
  @Entity('consultations')
  export class Consultation {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    fullName: string;
  
    @Index()
    @Column({ length: 30 })
    phone: string;
  
    @Index()
    @Column({ nullable: true })
    email?: string;
  
    @Column({ type: 'text', nullable: true })
    message?: string;
  
    /** snapshot tên GV để không phụ thuộc thay đổi dữ liệu */
    @Index()
    @Column({ nullable: true })
    teacherName?: string;
  
    /** quan hệ thật tới Teacher (không bắt buộc) */
    @ManyToOne(() => Teacher, { nullable: true, onDelete: 'SET NULL', eager: true })
    @JoinColumn({ name: 'teacherId' })
    teacher?: Teacher;
  
    @Column({ nullable: true })
    teacherId?: number;
  
    /** nguồn phát sinh yêu cầu (vd: blog) */
    @Column({ nullable: true })
    source?: string; // 'blog', 'landing', ...
  
    /** để truy vết từ bài viết nào (không bắt buộc) */
    @Column({ nullable: true })
    blogSlug?: string;
  
    @Index()
    @Column({ type: 'varchar', length: 20, default: 'new' })
    status: ConsultationStatus;
  
    /** ghi chú nội bộ cho CSKH */
    @Column({ type: 'text', nullable: true })
    note?: string;
  
    /** người xử lý (nếu bạn chưa có users, để string/number tùy ý) */
    @Column({ nullable: true })
    handledBy?: string;
  
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
  }
  