import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Delete } from '@nestjs/common';
import { BlogService } from './blog.service';
import {
  CreateBlogDto, UpdateBlogDto, QueryBlogsDto
} from './dto';

@Controller()
export class BlogController {
  constructor(private readonly svc: BlogService) {}


  // ===== Blogs =====
  @Get('blogs')
  listBlogs(@Query() q: QueryBlogsDto) { return this.svc.findBlogs(q); }

  @Post('blogs')
  createBlog(@Body() dto: CreateBlogDto) { return this.svc.createBlog(dto); }

  @Patch('blogs/:id')
  updateBlog(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBlogDto) {
    return this.svc.updateBlog(id, dto);
  }

  @Delete('blogs/:id')
  deleteBlog(@Param('id', ParseIntPipe) id: number) { return this.svc.removeBlog(id); }

  @Get('blogs/:id')
  getById(@Param('id', ParseIntPipe) id: number) { return this.svc.findById(id); }

  @Get('blogs/by-slug/:slug')
  getBySlug(@Param('slug') slug: string) { return this.svc.findBySlug(slug); }

  @Get()
  findAllBlogs(@Query('search') search: string) {
    return this.svc.findAll(search);
}
}
