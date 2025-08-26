// src/consultation/dto/create-consultation.dto.ts
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateConsultationDto {
  @IsString() @IsNotEmpty()
  fullName: string;

  @IsString() @IsNotEmpty() @Length(6, 30)
  phone: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString()
  message?: string;

  @IsOptional() @IsString()
  teacherName?: string;

  @IsOptional() @Type(() => Number) @IsInt()
  teacherId?: number;

  @IsOptional() @IsString()
  source?: string;        // mặc định: 'blog'

  @IsOptional() @IsString()
  blogSlug?: string;
}
