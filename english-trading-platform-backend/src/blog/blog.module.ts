import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from './blog.entity';
import { BlogCategory } from '../blog-category/blog-category.entity';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { Teacher } from 'src/teacher/teacher.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Blog, BlogCategory, Teacher])],
  providers: [BlogService],
  controllers: [BlogController],
  exports: [BlogService],
})
export class BlogModule {}
