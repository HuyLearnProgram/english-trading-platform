// src/review/dto/create-review.dto.ts
import { IsInt, IsString, IsNotEmpty } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  businessId: number;

  @IsInt()
  userId: number;

  @IsInt()
  serviceId: number;

  @IsInt()
  rating: number;

  @IsString()
  @IsNotEmpty()
  reviewText: string;
}
