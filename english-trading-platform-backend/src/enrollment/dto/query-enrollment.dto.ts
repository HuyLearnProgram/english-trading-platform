// src/enrollment/dto/query-enrollments.dto.ts
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '../enrollment.entity';

export class QueryEnrollmentsDto {
  @Type(() => Number) @IsOptional() @IsInt() teacherId?: number;
  @Type(() => Number) @IsOptional() @IsInt() studentId?: number;

  @IsOptional()
  @IsEnum(['paid','refunded','cancelled','pending'] as const)
  status?: OrderStatus;

  @Type(() => Number) @IsOptional() @IsInt() page?: number;
  @Type(() => Number) @IsOptional() @IsInt() limit?: number;
}
