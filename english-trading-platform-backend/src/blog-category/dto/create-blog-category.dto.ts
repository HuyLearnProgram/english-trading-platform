import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBlogCategoryDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsOptional() slug?: string;
  @IsString() @IsOptional() description?: string;
}