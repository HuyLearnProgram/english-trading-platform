import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogCategory } from './blog-category.entity';
import { BlogCategoryService } from './blog-category.service';
import { BlogCategoryController } from './blog-category.controller';
import { Blog } from 'src/blog/blog.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BlogCategory, Blog])],
  providers: [BlogCategoryService],
  controllers: [BlogCategoryController],
  exports: [BlogCategoryService],
})
export class BlogCategoryModule {}
