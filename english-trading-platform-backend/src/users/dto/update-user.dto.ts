// src/users/dto/update-user.dto.ts
import { IsEmail, IsOptional, IsString, IsUrl, IsIn, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { AccountStatus, UserRole } from '../user.entity';

export class UpdateUserDto {
  @IsOptional() @IsEmail()
  @Transform(({ value }) => String(value).toLowerCase().trim())
  email?: string;

  @IsOptional() @IsString()
  password?: string;

  @IsOptional() @IsIn(['admin', 'teacher', 'student'])
  role?: UserRole;

  @IsOptional() @IsUrl({ require_protocol: false }, { message: 'avatarUrl must be a valid URL' })
  avatarUrl?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsIn(['visible','hidden'] as const)
  status?: AccountStatus;
}
