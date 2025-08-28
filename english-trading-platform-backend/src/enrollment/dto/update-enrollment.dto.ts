// src/enrollment/dto/update-enrollment.dto.ts
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../enrollment.entity';

export class UpdateEnrollmentDto {
  @Type(() => Number) @IsOptional() @IsInt() teacherId?: number;
  @Type(() => Number) @IsOptional() @IsInt() studentId?: number;

  @IsOptional() @IsEnum(['paid','refunded','cancelled','pending'] as const) status?: OrderStatus;
  @Type(() => Number) @IsOptional() @IsInt() hoursPurchased?: number;
}
