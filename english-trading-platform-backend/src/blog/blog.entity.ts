// src/blog/blog.entity.ts
import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index,
    CreateDateColumn, UpdateDateColumn, JoinColumn
  } from 'typeorm';
  import { BlogCategory } from '../blog-category/blog-category.entity';
import { Teacher } from 'src/teacher/teacher.entity';
  
  @Entity('blogs')
  export class Blog {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column()
    title: string;
  
    @Index({ unique: true })
    @Column()
    slug: string;
  
    @ManyToOne(() => BlogCategory, (c) => c.blogs, { eager: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'categoryId' })
    category: BlogCategory;
  
    @Column({ nullable: true })
    categoryId: number;
  
    // ====== phần intro ======
    @Column({ type: 'text', nullable: true })
    introText?: string;
  
    // Lưu 1 ảnh hero: { src, caption? }
    @Column('json', { nullable: true })
    introImage?: { src: string; caption?: string };
    // ========================
  
    // Mục lục
    @Column('json', { nullable: true })
    toc?: any;
  
    // Các section lớn của bài
    @Column('json', { nullable: true })
    sections?: any;
  
    @Column('json', { nullable: true })
    meta?: { tags?: string[] };
  
    // Thêm nếu cần
    @Column({ type: 'varchar', length: 20, default: 'draft' })
    status: 'draft' | 'published';
  
    // ====== TÁC GIẢ (Teacher) ======
    @ManyToOne(() => Teacher, { eager: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'authorId' })
    author?: Teacher;

    @Column({ nullable: true })
    authorId?: number;
  
    @Column({ type: 'timestamp', nullable: true })
    publishedAt?: Date;
  
    @Column({ type: 'int', default: 0 })
    views: number;
  
    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
  }
  