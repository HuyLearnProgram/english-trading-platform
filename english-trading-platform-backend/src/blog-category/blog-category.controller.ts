import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Res } from "@nestjs/common";
import { BlogCategoryService } from "./blog-category.service";
import { CreateBlogCategoryDto, UpdateBlogCategoryDto } from "./dto";

@Controller('categories')
export class BlogCategoryController {
  constructor(private readonly service: BlogCategoryService) {}
    // ===== Categories =====
    @Get()
    listCategories() { return this.service.findAllCategories(); }
  
    @Post()
    createCategory(@Body() dto: CreateBlogCategoryDto) { return this.service.createCategory(dto); }
  
    @Patch('/:id')
    updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBlogCategoryDto) {
      return this.service.updateCategory(id, dto);
    }
  
    @Get('top-posts')
    getCategoriesWithTopPosts() { return this.service.findAllWithTopPosts(); }
    
}
