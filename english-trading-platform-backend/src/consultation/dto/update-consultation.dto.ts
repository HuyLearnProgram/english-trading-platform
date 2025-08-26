// src/consultation/dto/update-consultation.dto.ts
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ConsultationStatus } from '../consultation.entity';

export class UpdateConsultationDto {
  @IsOptional() @IsString()
  fullName?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  email?: string;

  @IsOptional() @IsString()
  message?: string;

  @IsOptional() @IsString()
  teacherName?: string;

  @IsOptional() @Type(() => Number) @IsInt()
  teacherId?: number;

  @IsOptional() @IsIn(['new','contacted','scheduled','done','canceled'] as ConsultationStatus[])
  status?: ConsultationStatus;

  @IsOptional() @IsString()
  note?: string;

  @IsOptional() @IsString()
  handledBy?: string;
}
