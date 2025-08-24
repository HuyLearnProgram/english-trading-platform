import { IsArray, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/** Sub DTOs */
export class ImageDto {
  @IsString() @IsNotEmpty() src: string;
  @IsString() @IsOptional() caption?: string;
}

export class LinkDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsUrl() url: string;
}
export class TocItemDto {
  @IsString() @IsNotEmpty() id: string;
  @IsString() @IsNotEmpty() label: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => TocItemDto)
  children?: TocItemDto[];
}
export class SectionDto {
  @IsString() @IsNotEmpty() id: string;
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsOptional() text?: string;
  @IsOptional() @ValidateNested() @Type(() => ImageDto) image?: ImageDto;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => LinkDto) links?: LinkDto[];
}