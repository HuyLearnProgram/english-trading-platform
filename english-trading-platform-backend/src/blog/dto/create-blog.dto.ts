import { IsArray, IsDateString, IsIn, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';


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

  @IsInt() @Type(() => Number) @IsOptional()
  authorId?: number;

  @IsDateString() @IsOptional() publishedAt?: string;
}