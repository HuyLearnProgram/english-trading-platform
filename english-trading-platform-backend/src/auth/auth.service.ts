// auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from '../users/dto/login-user.dto';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  private validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  async validateUser(email: string, pass: string): Promise<any> {
    if (!this.validateEmail(email)) {
      throw new UnauthorizedException('Invalid email format. Please enter a valid email.');
    }
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    throw new UnauthorizedException('Invalid password');
  }

  async login(loginUserDto: LoginUserDto) {
    const user = await this.validateUser(loginUserDto.email, loginUserDto.password);
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      id: user.id,
      role: user.role,
    };
  }

  async register(createUserDto: CreateUserDto) {
    if (!this.validateEmail(createUserDto.email)) {
      throw new BadRequestException('Invalid email format. Please enter a valid email.');
    }
    const user = await this.usersService.findByEmail(createUserDto.email);
    if (user) {
      throw new BadRequestException('Email already exists');
    }
    return this.usersService.create(createUserDto);
  }
}
