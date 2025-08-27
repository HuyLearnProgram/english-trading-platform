// src/teacher/dto/create-teacher.dto.ts
import { IsString, IsOptional, IsNumber, IsArray, IsObject } from 'class-validator';

export class CreateTeacherDto {
  @IsString() fullName: string;
  @IsString() @IsOptional() avatarUrl?: string;
  @IsString() @IsOptional() headline?: string;
  @IsString() @IsOptional() bio?: string;
  @IsString() @IsOptional() country?: string;
  @IsString() @IsOptional() specialties?: string;
  @IsNumber() @IsOptional() hourlyRate?: number;

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
