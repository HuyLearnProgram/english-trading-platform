import { IsOptional, IsString } from 'class-validator';

export class UpdateBlogCategoryDto {
  @IsString() @IsOptional() name?: string;
  @IsString() @IsOptional() slug?: string;
  @IsString() @IsOptional() description?: string;
}