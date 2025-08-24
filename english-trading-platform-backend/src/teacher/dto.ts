// src/teacher/dto.ts
import { IsDecimal, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTeacherDto {
  @IsString() @IsNotEmpty() fullName: string;
  @IsString() @IsOptional() avatarUrl?: string;
  @IsString() @IsOptional() headline?: string;
  @IsString() @IsOptional() bio?: string;
  @IsString() @IsOptional() country?: string;        // có thể là 1 country hoặc CSV
  @IsString() @IsOptional() specialties?: string;    // CSV: “IELTS, Speaking”
  @IsNumber() @IsOptional() hourlyRate?: number;

  // thêm các field để BE lưu được
  @IsString() @IsOptional() gender?: string;         // “Male,Female” hoặc 1 giá trị
  @IsString() @IsOptional() level?: string;          // “Beginner,Intermediate” (CSV)
  @IsString() @IsOptional() certs?: string;          // “IELTS,TOEFL” (CSV)
}

export class UpdateTeacherDto {
  @IsString() @IsOptional() fullName?: string;
  @IsString() @IsOptional() avatarUrl?: string;
  @IsString() @IsOptional() headline?: string;
  @IsString() @IsOptional() bio?: string;
  @IsString() @IsOptional() country?: string;
  @IsString() @IsOptional() specialties?: string;
  @IsNumber() @IsOptional() hourlyRate?: number;
  @IsNumber() @Min(0) @Max(5) @IsOptional() rating?: number;
  @IsInt() @IsOptional() reviewsCount?: number;

  @IsString() @IsOptional() gender?: string;
  @IsString() @IsOptional() level?: string;
  @IsString() @IsOptional() certs?: string;
}

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

  @Type(() => Number) @IsInt() @IsOptional() page?: number;   // mặc định 1
  @Type(() => Number) @IsInt() @IsOptional() limit?: number;  // mặc định 12
}
