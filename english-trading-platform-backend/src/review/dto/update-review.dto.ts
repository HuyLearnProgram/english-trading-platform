// src/review/dto/update-review.dto.ts
import { IsInt, IsString, IsOptional } from 'class-validator';

export class UpdateReviewDto {
  @IsInt()
  @IsOptional()
  rating?: number;

  @IsString()
  @IsOptional()
  reviewText?: string;

  @IsString()
  @IsOptional()
  ownerReply?: string;
}
