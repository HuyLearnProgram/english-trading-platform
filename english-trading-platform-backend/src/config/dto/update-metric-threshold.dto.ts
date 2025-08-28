// src/config/dto/update-metric-threshold.dto.ts
import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMetricThresholdDto {
  @IsString() @IsOptional() key?: string;
  @IsEnum(['up','down','window']) @IsOptional() direction?: 'up'|'down'|'window';
  @Type(() => Number) @IsNumber() @IsOptional() good?: number;
  @Type(() => Number) @IsNumber() @IsOptional() warn?: number;
  @Type(() => Number) @IsInt()    @IsOptional() windowDays?: number;
  @Type(() => Number) @IsInt()    @IsOptional() updated_by?: number;
}
