import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';


export class QueryTeachersDto {
  @IsString() @IsOptional() search?: string;

  // Các tham số FE đang truyền (có thể là CSV)
  @IsString() @IsOptional() country?: string;
  @IsString() @IsOptional() specialties?: string;
  @IsString() @IsOptional() gender?: string;
  @IsString() @IsOptional() level?: string;
  @IsString() @IsOptional() certs?: string;

  @IsString() @IsOptional() timeOfDay?: string; // "morning,evening"
  @IsString() @IsOptional() days?: string;      // "0,2,5" hoặc "mon,tue"

  @Type(() => Number) @IsNumber() @IsOptional() minRating?: number;
  @Type(() => Number) @IsNumber() @IsOptional() priceMin?: number;
  @Type(() => Number) @IsNumber() @IsOptional() priceMax?: number;
  

  @IsString() @IsOptional() sort?: 'rating_desc' | 'price_asc' | 'price_desc' | 'newest';

  @Type(() => Number) @IsInt() @IsOptional() lessonLengthMinutes?: number;
  @Type(() => Number) @IsInt() @IsOptional() page?: number;   // mặc định 1
  @Type(() => Number) @IsInt() @IsOptional() limit?: number;  // mặc định 12
}
