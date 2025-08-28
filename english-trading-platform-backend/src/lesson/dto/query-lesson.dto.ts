// src/lesson/dto/query-lesson.dto.ts
import { IsDateString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { LessonStatus } from '../lesson.entity';

export class QueryLessonsDto {
  @Type(() => Number) @IsOptional() @IsInt() teacherId?: number;
  @Type(() => Number) @IsOptional() @IsInt() studentId?: number;

  @IsOptional() @IsEnum(['scheduled','completed','cancelled'] as const) status?: LessonStatus;

  @IsOptional() @IsDateString() from?: string; // lọc theo startAt
  @IsOptional() @IsDateString() to?: string;

  @Type(() => Number) @IsOptional() @IsInt() page?: number;
  @Type(() => Number) @IsOptional() @IsInt() limit?: number;
}
