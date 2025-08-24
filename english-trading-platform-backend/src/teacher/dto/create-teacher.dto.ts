import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';


export class CreateTeacherDto {
  @IsString() @IsNotEmpty() fullName: string;
  @IsString() @IsOptional() avatarUrl?: string;
  @IsString() @IsOptional() headline?: string;
  @IsString() @IsOptional() bio?: string;
  @IsString() @IsOptional() country?: string;        // có thể là 1 country hoặc CSV
  @IsString() @IsOptional() specialties?: string;    // CSV: “IELTS, Speaking”
  @IsNumber() @IsOptional() hourlyRate?: number;

  // thêm các field để BE lưu được
  @IsString() @IsOptional() gender?: string;         // “Male,Female” hoặc 1 giá trị
  @IsString() @IsOptional() level?: string;          // “Beginner,Intermediate” (CSV)
  @IsString() @IsOptional() certs?: string;          // “IELTS,TOEFL” (CSV)
}