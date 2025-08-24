import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BlogCategory } from "./blog-category.entity";
import { CreateBlogCategoryDto, UpdateBlogCategoryDto } from "src/blog/dto";

const slugify = (s: string) =>
  s.toLowerCase()
   .normalize('NFKD').replace(/[\u0300-\u036F]/g, '')
   .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

// category.service.ts (hoặc có thể viết trực tiếp trong controller)
@Injectable()
export class BlogCategoryService {
  constructor(
    @InjectRepository(BlogCategory) private readonly catRepo: Repository<BlogCategory>,
  ) {}

  // ===== Category =====
  async createCategory(dto: CreateBlogCategoryDto) {
    const cat = this.catRepo.create({ ...dto, slug: dto.slug || slugify(dto.name) });
    return this.catRepo.save(cat);
  }
  async updateCategory(id: number, dto: UpdateBlogCategoryDto) {
    const cur = await this.catRepo.preload({ id, ...dto, slug: dto.slug || undefined });
    if (!cur) throw new NotFoundException('Category not found');
    if (dto.name && !dto.slug) cur.slug = slugify(dto.name);
    return this.catRepo.save(cur);
  }
  findAllCategories() { return this.catRepo.find({ order: { name: 'ASC' } }); }
  async findCategoryBySlug(slug: string) {
    const c = await this.catRepo.findOne({ where: { slug } });
    if (!c) throw new NotFoundException('Category not found');
    return c;
  }

  async findAllWithTopPosts(): Promise<any[]> {
    // Lấy tất cả category cùng với các blog liên kết
    const categories = await this.catRepo.find({
      relations: ['blogs'],  // load danh sách blogs của từng category:contentReference[oaicite:1]{index=1}
    });
    // Đối với mỗi category, sắp xếp blog theo views giảm dần và lấy 3 bài đầu
    const result = categories.map(category => {
      const topBlogs = category.blogs
        .sort((a, b) => b.views - a.views)      // sắp xếp giảm dần theo lượt xem
        .slice(0, 3);                           // lấy 3 bài đầu tiên
      return {
        id: category.id,
        name: category.name,
        topBlogs: topBlogs,
      };
    });
    return result;
  }
}
