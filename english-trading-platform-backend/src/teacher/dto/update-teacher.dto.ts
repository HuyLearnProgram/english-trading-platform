import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateTeacherDto {
    @IsString() @IsOptional() fullName?: string;
    @IsString() @IsOptional() avatarUrl?: string;
    @IsString() @IsOptional() headline?: string;
    @IsString() @IsOptional() bio?: string;
    @IsString() @IsOptional() country?: string;
    @IsString() @IsOptional() specialties?: string;
    @IsNumber() @IsOptional() hourlyRate?: number;
    @IsNumber() @Min(0) @Max(5) @IsOptional() rating?: number;
    @IsInt() @IsOptional() reviewsCount?: number;
  
    @IsString() @IsOptional() gender?: string;
    @IsString() @IsOptional() level?: string;
    @IsString() @IsOptional() certs?: string;
  }
  