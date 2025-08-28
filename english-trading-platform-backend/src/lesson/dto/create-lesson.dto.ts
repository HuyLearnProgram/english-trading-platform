// src/lesson/dto/create-lesson.dto.ts
import { IsDateString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { CancelledBy, LessonStatus } from '../lesson.entity';
import { Type } from 'class-transformer';

export class CreateLessonDto {
  @Type(() => Number) @IsInt() teacherId: number;
  @Type(() => Number) @IsInt() studentId: number;

  @IsDateString() startAt: string;               // ISO string
  @IsOptional() @IsDateString() teacherJoinedAt?: string;

  @IsEnum(['scheduled','completed','cancelled'] as const) status: LessonStatus;
  @IsOptional() @IsEnum(['teacher','student','system'] as const) cancelledBy?: CancelledBy;
}
