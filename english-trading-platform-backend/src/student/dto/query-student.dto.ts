// src/student/dto/student.dto.ts
import { IsInt, IsOptional, IsString } from 'class-validator';

export class QueryStudentDto {
  @IsOptional() @IsInt() page?: number;
  @IsOptional() @IsInt() limit?: number;
  @IsOptional() @IsString() q?: string;
}