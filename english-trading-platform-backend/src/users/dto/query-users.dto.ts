// src/users/dto/query-users.dto.ts
import { IsOptional, IsIn, IsInt, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountStatus } from '../user.entity';

export class QueryUsersDto {
  @IsOptional() @IsString() emailLike?: string;
  @IsOptional() @IsString() role?: string; // 'admin'|'teacher'|'student'
  @IsOptional() @IsIn(['visible','hidden'] as const) status?: AccountStatus;

  @Type(() => Number) @IsOptional() @IsInt() page?: number;
  @Type(() => Number) @IsOptional() @IsInt() limit?: number;
}
