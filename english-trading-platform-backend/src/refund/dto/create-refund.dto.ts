// src/refund/dto/create-refund.dto.ts
import { IsBoolean, IsEnum, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { RefundStatus } from '../refund-request.entity';

export class CreateRefundDto {
  @Type(() => Number) @IsInt() teacherId: number;
  @Type(() => Number) @IsInt() studentId: number;

  @IsBoolean() eligible: boolean;
  @IsEnum(['approved','rejected','pending'] as const) status: RefundStatus;
}
