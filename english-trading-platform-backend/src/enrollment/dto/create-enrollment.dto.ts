// src/enrollment/dto/create-enrollment.dto.ts
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../enrollment.entity';

export class CreateEnrollmentDto {
  @Type(() => Number) @IsInt() teacherId: number;
  @Type(() => Number) @IsInt() studentId: number;

  @IsEnum(['paid','refunded','cancelled','pending'] as const) status: OrderStatus;
  @Type(() => Number) @IsInt() @IsOptional() hoursPurchased?: number;
}
