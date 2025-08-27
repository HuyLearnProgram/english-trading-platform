// src/teacher/dto/update-teacher.dto.ts
import { IsString, IsOptional, IsNumber, IsInt, Min, Max, IsArray, IsObject } from 'class-validator';

export class UpdateTeacherDto {
  @IsString() @IsOptional() fullName?: string;
  @IsString() @IsOptional() avatarUrl?: string;
  @IsString() @IsOptional() headline?: string;
  @IsString() @IsOptional() bio?: string;
  @IsString() @IsOptional() country?: string;
  @IsString() @IsOptional() specialties?: string;
  @IsNumber() @IsOptional() hourlyRate?: number;
  @IsNumber() @Min(0) @Max(5) @IsOptional() rating?: number;
  @IsInt()    @IsOptional() reviewsCount?: number;

  @IsString() @IsOptional() gender?: string;
  @IsString() @IsOptional() level?: string;
  @IsString() @IsOptional() certs?: string;

  @IsObject() @IsOptional() weeklyAvailability?: any;
  @IsArray()  @IsOptional() certificates?: any[];
  @IsArray()  @IsOptional() education?: any[];
  @IsArray()  @IsOptional() experiences?: any[];
  @IsString() @IsOptional() demoVideoUrl?: string;
  @IsString() @IsOptional() sampleClassVideoUrl?: string;
  @IsString() @IsOptional() audioUrl?: string;
}
