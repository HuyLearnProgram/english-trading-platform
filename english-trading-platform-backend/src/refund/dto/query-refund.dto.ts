// src/refund/dto/query-refund.dto.ts
import { IsBooleanString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { RefundStatus } from '../refund-request.entity';

export class QueryRefundsDto {
  @Type(() => Number) @IsOptional() @IsInt() teacherId?: number;
  @Type(() => Number) @IsOptional() @IsInt() studentId?: number;

  @IsOptional() @IsEnum(['approved','rejected','pending'] as const) status?: RefundStatus;
  @IsOptional() @IsBooleanString() eligible?: string;  // 'true' | 'false'

  @Type(() => Number) @IsOptional() @IsInt() page?: number;
  @Type(() => Number) @IsOptional() @IsInt() limit?: number;
}
