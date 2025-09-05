import { IsOptional } from "class-validator";

export class CheckSlotsDto {
  @IsOptional() slots?: string[];                   // ['mon 10:00-11:00', ...]
}