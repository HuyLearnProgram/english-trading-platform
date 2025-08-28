// src/refund/dto/update-refund.dto.ts
import { IsBoolean, IsEnum, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { RefundStatus } from '../refund-request.entity';

export class UpdateRefundDto {
  @Type(() => Number) @IsOptional() @IsInt() teacherId?: number;
  @Type(() => Number) @IsOptional() @IsInt() studentId?: number;

  @IsOptional() @IsBoolean() eligible?: boolean;
  @IsOptional() @IsEnum(['approved','rejected','pending'] as const) status?: RefundStatus;
}
