import { IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';




export class QueryBlogsDto {
  @IsString() @IsOptional() search?: string;
  @IsString() @IsOptional() categorySlug?: string;
  @IsInt()  @Type(() => Number) @IsOptional() categoryId?: number;
  @Type(() => Number) @IsOptional() page?: number;
  @Type(() => Number) @IsOptional() limit?: number;
  @IsString() @IsOptional() sort?: 'newest'|'popular';
}