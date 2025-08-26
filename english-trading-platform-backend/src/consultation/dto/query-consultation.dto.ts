// src/consultation/dto/query-consultation.dto.ts
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ConsultationStatus } from '../consultation.entity';

export class QueryConsultationDto {
  @IsOptional() @IsString()
  search?: string; // tìm theo tên/điện thoại/email/teacherName

  @IsOptional() @IsIn(['new','contacted','scheduled','done','canceled'] as ConsultationStatus[])
  status?: ConsultationStatus;

  @IsOptional() @Type(() => Number) @IsInt()
  teacherId?: number;

  @IsOptional() @Type(() => Number) @IsInt()
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt()
  limit?: number;
}
