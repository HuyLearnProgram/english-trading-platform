// src/lesson/dto/update-lesson.dto.ts
import { IsDateString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { CancelledBy, LessonStatus } from '../lesson.entity';
import { Type } from 'class-transformer';

export class UpdateLessonDto {
  @Type(() => Number) @IsOptional() @IsInt() teacherId?: number;
  @Type(() => Number) @IsOptional() @IsInt() studentId?: number;

  @IsOptional() @IsDateString() startAt?: string;
  @IsOptional() @IsDateString() teacherJoinedAt?: string;

  @IsOptional() @IsEnum(['scheduled','completed','cancelled'] as const) status?: LessonStatus;
  @IsOptional() @IsEnum(['teacher','student','system'] as const) cancelledBy?: CancelledBy;
}
