// src/config/dto/create-metric-threshold.dto.ts
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMetricThresholdDto {
  @IsString() @IsNotEmpty() key: string;
  @IsEnum(['up','down','window']) direction: 'up'|'down'|'window';

  // up/down
  @Type(() => Number) @IsNumber() @IsOptional() good?: number;
  @Type(() => Number) @IsNumber() @IsOptional() warn?: number;

  // window
  @Type(() => Number) @IsInt() @IsOptional() windowDays?: number;

  @Type(() => Number) @IsInt() @IsOptional() updated_by?: number;
}
