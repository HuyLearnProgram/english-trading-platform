// src/student/dto/update-student.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class UpdateStudentDto {
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() timezone?: string;

  @IsOptional() @IsString() dob?: string;

  @IsOptional() @IsString() level?: string;
  @IsOptional() @IsString() goals?: string;
}
