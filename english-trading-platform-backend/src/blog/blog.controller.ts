import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Delete } from '@nestjs/common';
import { BlogService } from './blog.service';
import {
  CreateBlogDto, UpdateBlogDto, QueryBlogsDto
} from './dto';

@Controller('blogs')
export class BlogController {
  constructor(private readonly svc: BlogService) {}


  // ===== Blogs =====
  @Get()
  listBlogs(@Query() q: QueryBlogsDto) { return this.svc.findBlogs(q); }

  @Post()
  createBlog(@Body() dto: CreateBlogDto) { return this.svc.createBlog(dto); }

  @Patch('/:id')
  updateBlog(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBlogDto) {
    return this.svc.updateBlog(id, dto);
  }

  @Delete('/:id')
  deleteBlog(@Param('id', ParseIntPipe) id: number) { return this.svc.removeBlog(id); }

  @Get('/:id')
  getById(@Param('id', ParseIntPipe) id: number) { return this.svc.findById(id); }

  @Get('/by-slug/:slug')
  getBySlug(@Param('slug') slug: string) { return this.svc.findBySlug(slug); }

  @Get()
  findAllBlogs(@Query('search') search: string) {
    return this.svc.findAll(search);
}
}
