// src/teacher/dto/weekly-availability.dto.ts
import { IsOptional, ValidateNested, IsArray, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class IntervalDto {
  @Matches(/^\d{2}:\d{2}$/, { message: 'start phải là HH:MM' })
  start!: string;

  @Matches(/^\d{2}:\d{2}$/, { message: 'end phải là HH:MM' })
  end!: string;
}

export class WeeklyAvailabilityDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => IntervalDto) @IsOptional()
  mon?: IntervalDto[];

  @IsArray() @ValidateNested({ each: true }) @Type(() => IntervalDto) @IsOptional()
  tue?: IntervalDto[];

  @IsArray() @ValidateNested({ each: true }) @Type(() => IntervalDto) @IsOptional()
  wed?: IntervalDto[];

  @IsArray() @ValidateNested({ each: true }) @Type(() => IntervalDto) @IsOptional()
  thu?: IntervalDto[];

  @IsArray() @ValidateNested({ each: true }) @Type(() => IntervalDto) @IsOptional()
  fri?: IntervalDto[];

  @IsArray() @ValidateNested({ each: true }) @Type(() => IntervalDto) @IsOptional()
  sat?: IntervalDto[];

  @IsArray() @ValidateNested({ each: true }) @Type(() => IntervalDto) @IsOptional()
  sun?: IntervalDto[];
}
