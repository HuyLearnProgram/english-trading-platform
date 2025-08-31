// src/teacher/dto/create-teacher.dto.ts
import {
  IsString, IsOptional, IsNumber, IsArray, IsInt, IsIn, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WeeklyAvailabilityDto } from './weekly-availability.dto';

export class CreateTeacherDto {
  @IsString() fullName!: string;

  @IsString() @IsOptional() avatarUrl?: string;
  @IsString() @IsOptional() headline?: string;
  @IsString() @IsOptional() bio?: string;
  @IsString() @IsOptional() country?: string;
  @IsString() @IsOptional() specialties?: string;

  @IsNumber() @IsOptional() hourlyRate?: number;

  @IsString() @IsOptional() gender?: string;
  @IsString() @IsOptional() level?: string;
  @IsString() @IsOptional() certs?: string;

  /** 45 | 60 | 90 (mặc định ở service: 45) */
  @IsInt() @IsIn([45, 60, 90], { message: 'lessonLengthMinutes phải là 45, 60 hoặc 90' })
  @IsOptional()
  lessonLengthMinutes?: number;

  @ValidateNested() @Type(() => WeeklyAvailabilityDto) @IsOptional()
  weeklyAvailability?: WeeklyAvailabilityDto;

  @IsArray()  @IsOptional() certificates?: any[];
  @IsArray()  @IsOptional() education?: any[];
  @IsArray()  @IsOptional() experiences?: any[];

  @IsString() @IsOptional() demoVideoUrl?: string;
  @IsString() @IsOptional() sampleClassVideoUrl?: string;
  @IsString() @IsOptional() audioUrl?: string;
}
