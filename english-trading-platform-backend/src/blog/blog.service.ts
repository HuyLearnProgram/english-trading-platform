import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, ILike } from 'typeorm';
import { Blog } from './blog.entity';
import { BlogCategory } from '../blog-category/blog-category.entity';
import {
  CreateBlogDto, UpdateBlogDto, QueryBlogsDto
} from './dto';
import { Teacher } from 'src/teacher/teacher.entity';

const slugify = (s: string) =>
  s.toLowerCase()
   .normalize('NFKD').replace(/[\u0300-\u036F]/g, '')
   .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(Blog) private readonly blogRepo: Repository<Blog>,
    @InjectRepository(BlogCategory) private readonly catRepo: Repository<BlogCategory>,
    @InjectRepository(Teacher) private readonly teacherRepo: Repository<Teacher>,
  ) {}

  // ===== Blog =====
  // ===== Blog =====
  async createBlog(dto: CreateBlogDto) {
    const introText = dto.introText ?? dto.intro?.text ?? null;
    const introImage =
      dto.introImage ??
      (dto.intro?.images && dto.intro.images.length
        ? { src: dto.intro.images[0].src, caption: dto.intro.images[0].caption }
        : null);

    // Validate authorId (nếu truyền lên)
    if (dto.authorId) {
      const exist = await this.teacherRepo.findOne({ where: { id: dto.authorId } });
      if (!exist) throw new NotFoundException('Teacher (author) not found');
    }

    const blog = this.blogRepo.create({
      title: dto.title,
      slug: dto.slug || slugify(dto.title),
      categoryId: dto.categoryId,
      introText,
      introImage,
      toc: dto.toc,
      sections: dto.sections,
      status: dto.status ?? 'draft',
      authorId: dto.authorId ?? null,
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
    });

    return this.blogRepo.save(blog);
  }
  
  async updateBlog(id: number, dto: UpdateBlogDto) {
    const introText = dto.introText ?? dto.intro?.text ?? undefined;
    const introImage =
      dto.introImage ??
      (dto.intro?.images && dto.intro.images.length
        ? { src: dto.intro.images[0].src, caption: dto.intro.images[0].caption }
        : undefined);

    if (dto.authorId !== undefined && dto.authorId !== null) {
      const exist = await this.teacherRepo.findOne({ where: { id: dto.authorId } });
      if (!exist) throw new NotFoundException('Teacher (author) not found');
    }

    const cur = await this.blogRepo.preload({
      id,
      title: dto.title,
      slug: dto.slug || undefined,
      categoryId: dto.categoryId,
      introText,
      introImage,
      toc: dto.toc,
      sections: dto.sections,
      status: dto.status,
      authorId: dto.authorId, // <- thay vì author JSON
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
    });

    if (!cur) throw new NotFoundException('Blog not found');
    if (dto.title && !dto.slug) cur.slug = slugify(dto.title);

    return this.blogRepo.save(cur);
  }
  
  async removeBlog(id: number) {
    const b = await this.blogRepo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Blog not found');
    await this.blogRepo.remove(b);
    return { deleted: true };
  }

  async findBlogs(q: QueryBlogsDto) {
    const page = Math.max(1, q.page ?? 1);
    const limit = Math.min(50, Math.max(1, q.limit ?? 12));

    const qb = this.blogRepo.createQueryBuilder('b')
      .leftJoinAndSelect('b.category', 'c')
      .leftJoinAndSelect('b.author', 't'); // Thêm join với bảng Teacher

    if (q.search) {
      const s = `%${q.search.toLowerCase()}%`;
      qb.andWhere(new Brackets(w => {
        w.where('LOWER(b.title) LIKE :s', { s })
         .orWhere('LOWER(b.introText) LIKE :s', { s });
      }));
    }
    if (q.categoryId) qb.andWhere('b.categoryId = :cid', { cid: q.categoryId });
    if (q.categorySlug) qb.andWhere('c.slug = :cslug', { cslug: q.categorySlug });

    switch (q.sort) {
      case 'popular': qb.orderBy('b.views', 'DESC'); break;
      default:        qb.orderBy('b.publishedAt', 'DESC');
    }

    const [items, total] = await qb.skip((page-1)*limit).take(limit).getManyAndCount();
    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: number) {
    const b = await this.blogRepo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Blog not found');
    return b;
  }

  async findBySlug(slug: string) {
    const b = await this.blogRepo.findOne({ where: { slug } });
    if (!b) throw new NotFoundException('Blog not found');
    return b;
  }
  async findAll(search?: string): Promise<Blog[]> {
    if (search) {
      return this.blogRepo.find({
        where: { title: ILike(`%${search}%`) }  // tìm tiêu đề chứa từ khóa
      });
    }
    return this.blogRepo.find();
  }
}
