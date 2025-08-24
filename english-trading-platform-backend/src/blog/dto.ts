import { IsArray, IsDateString, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/** Sub DTOs */
export class ImageDto {
  @IsString() @IsNotEmpty() src: string;
  @IsString() @IsOptional() caption?: string;
}
export class LinkDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsUrl() url: string;
}
export class TocItemDto {
  @IsString() @IsNotEmpty() id: string;
  @IsString() @IsNotEmpty() label: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TocItemDto)
  children?: TocItemDto[];
}
export class SectionDto {
  @IsString() @IsNotEmpty() id: string;
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsOptional() text?: string;
  @IsOptional() @ValidateNested() @Type(() => ImageDto) image?: ImageDto;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LinkDto) links?: LinkDto[];
}

/** Category */
export class CreateBlogCategoryDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsOptional() slug?: string;
  @IsString() @IsOptional() description?: string;
}
export class UpdateBlogCategoryDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() slug?: string;
  @IsString() @IsOptional() description?: string;
}

/** Blog */
export class CreateBlogDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsOptional() slug?: string;

  @IsInt() categoryId: number;

  // Cho phép gửi trực tiếp
  @IsString() @IsOptional() introText?: string;
  @IsObject() @IsOptional() introImage?: { src: string; caption?: string };

  // Hoặc gửi gộp vào "intro"
  @IsObject() @IsOptional() intro?: { text?: string; images?: Array<{ src: string; caption?: string }> };

  @IsArray() @IsOptional() toc?: any[];
  @IsArray() @IsOptional() sections?: any[];

  @IsIn(['draft','published']) @IsOptional() status?: 'draft' | 'published';
  @IsObject() @IsOptional() author?: { name?: string; avatar?: string; bio?: string; socials?: any };

  @IsDateString() @IsOptional() publishedAt?: string;
}
export class UpdateBlogDto extends CreateBlogDto {}

export class QueryBlogsDto {
  @IsString() @IsOptional() search?: string;
  @IsString() @IsOptional() categorySlug?: string;
  @IsInt()  @Type(() => Number) @IsOptional() categoryId?: number;
  @Type(() => Number) @IsOptional() page?: number;
  @Type(() => Number) @IsOptional() limit?: number;
  @IsString() @IsOptional() sort?: 'newest'|'popular';
}
