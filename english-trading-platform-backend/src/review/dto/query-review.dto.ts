// src/review/dto/query-reviews.dto.ts
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class QueryReviewDto {
  @Type(() => Number) @IsInt() @IsOptional() page?: number;   // default 1
  @Type(() => Number) @IsInt() @IsOptional() limit?: number;  // default 10, max 50
}
