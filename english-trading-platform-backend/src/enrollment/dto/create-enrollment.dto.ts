// src/enrollment/dto/create-enrollment.dto.ts
import { IsEnum, IsInt, IsOptional, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../enrollment.entity';

export class CreateEnrollmentDto {
  @Type(() => Number) @IsInt() teacherId: number;
  @Type(() => Number) @IsInt() studentId: number; // nếu có JWT có thể bỏ qua field này ở FE

  @Type(() => Number) @IsInt() planHours: number; 
  @Type(() => Number) @IsOptional() @IsInt() lessonsPerWeek?: number;

  @IsOptional()
  @IsEnum(['paid','refunded','cancelled','pending'] as const)
  status?: OrderStatus;

  @IsOptional()
  @IsArray()
  preferredSlots?: string[]; // ['mon 09:00-09:45', ...]
}
