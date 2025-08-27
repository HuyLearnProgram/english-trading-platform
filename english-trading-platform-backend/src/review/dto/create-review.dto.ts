// src/review/dto/create-review.dto.ts
import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  teacherId: number;           

  @IsInt()
  userId: number;

  @IsInt()
  rating: number;              // 1..5

  @IsString()
  @IsNotEmpty()
  reviewText: string;

  // optional cho UI: "Communication V60", "60.00 tổng số giờ"
  @IsString() @IsOptional()
  courseName?: string;

  @IsString() @IsOptional()
  totalHours?: string;         // lưu '60.00' dạng text để dễ render y hệt
}
