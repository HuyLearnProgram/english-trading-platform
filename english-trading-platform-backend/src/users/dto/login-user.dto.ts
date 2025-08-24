import { IsEmail, IsString } from 'class-validator';

export class LoginUserDto {
  @IsEmail({}, { message: 'Invalid email format. Please enter a valid email.' })
  email: string;

  @IsString()
  password: string;
}
